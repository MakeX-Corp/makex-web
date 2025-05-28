import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { checkMessageLimit } from "@/utils/server/check-daily-limit";
import { createTools } from "@/utils/server/tool-factory";
import { getPrompt } from "@/utils/server/prompt";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { getBedrockClient } from "@/utils/server/bedrock-client";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";
// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

// GET /api/chat - Get all messages for a specific session
export async function GET(req: Request) {
  try {
    const userResult = await getSupabaseWithUser(req as NextRequest);
    if (userResult instanceof NextResponse) return userResult;
    if ('error' in userResult) return userResult.error;
    const { supabase, user } = userResult;

    // Get session ID from query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const appId = searchParams.get("appId");

    if (!sessionId || !appId) {
      return NextResponse.json(
        { error: "Session ID and App ID are required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user and app
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from("app_chat_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("app_id", appId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      appId,
      appName,
      sessionId,
      supabase_project,
      messageParts,
      multiModal,
      apiUrl,
      subscription,
    } = await req.json();

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];

    // Get the user API client
    const userResult = await getSupabaseWithUser(req as NextRequest );
    if (userResult instanceof NextResponse || 'error' in userResult) return userResult;
    const { supabase, user, token } = userResult;

    // Check if app is already being changed
    const { data: appStatus, error: statusError } = await supabase
      .from("user_sandboxes")
      .select("app_status")
      .eq("app_id", appId)
      .single();

    if (statusError) {
      return NextResponse.json(
        { error: "Failed to check app status" },
        { status: 500 }
      );
    }

    if (appStatus?.app_status === "changing") {
      return NextResponse.json(
        { error: "App is currently being modified. Please try again later." },
        { status: 409 }
      );
    }

    // Lock the app
    const trimmedAppId = appId.trim();
    console.log('Debug appId:', {
      original: appId,
      trimmed: trimmedAppId,
      length: trimmedAppId.length,
      hasWhitespace: appId !== trimmedAppId
    });

    const supabaseAdmin = await getSupabaseAdmin();
    const { error: lockError, data: lockData, count } = await supabaseAdmin
      .from("user_sandboxes")
      .update({ 
        app_status: "changing",
        sandbox_updated_at: new Date().toISOString()
      })
      .eq("app_id", trimmedAppId)
      .select();

    console.log('App lock attempt:', {
      appId: trimmedAppId,
      success: !lockError,
      error: lockError,
      data: lockData,
      count,
      timestamp: new Date().toISOString()
    });

    // Check if we actually found and updated a record
    if (!lockError && (!lockData || lockData.length === 0)) {
      console.warn(`No record found to update for app_id: ${trimmedAppId}`);
    }

    if (lockError) {
      return NextResponse.json(
        { error: "Failed to lock app" },
        { status: 500 }
      );
    }

    try {
      // Check daily message limit using the new utility function
      const limitCheck = await checkMessageLimit(supabase, user, subscription);
      if (limitCheck.error) {
        return NextResponse.json(
          { error: limitCheck.error },
          { status: limitCheck.status }
        );
      }

      // Get app details from the database
      const { data: app, error: appError } = await supabase
        .from("user_apps")
        .select("*")
        .eq("id", trimmedAppId)
        .single();

      if (appError) {
        return NextResponse.json(
          { error: "Failed to fetch app details" },
          { status: 500 }
        );
      }

      const apiClient = createFileBackendApiClient(app.api_url);

 

      // Get the file tree
      const fileTreeResponse = await apiClient.get("/file-tree", { path: "." });
      const fileTree = fileTreeResponse;

      const modelName = "claude-3-5-sonnet-latest";

      const tools = createTools({
        apiUrl: app.api_url,
      });

      // Format messages for the model
      const formattedMessages = messages.map((message: any, index: number) => {
        // Check if this is the last user message and we're using multi-modal format
        if (
          index === messages.length - 1 &&
          message.role === "user" &&
          multiModal &&
          messageParts
        ) {
          return {
            role: message.role,
            content: messageParts,
          };
        }
        // For messages with experimental_attachments
        else if (message.experimental_attachments?.length) {
          const content = [{ type: "text", text: message.content || "" }];

          // Add each attachment as a separate image part
          for (const attachment of message.experimental_attachments) {
            // Check if it's a base64 image
            if (attachment.url && attachment.url.startsWith("data:image/")) {
              content.push({
                type: "image",
                // @ts-ignore
                image: attachment.url,
              });
            }
          }

          return {
            role: message.role,
            content: content,
          };
        }
        // Regular text message
        else {
          return {
            role: message.role,
            content: message.content,
          };
        }
      });

      await supabase.from("app_chat_history").insert({
        app_id: trimmedAppId,
        user_id: user.id,
        content: lastUserMessage.content,
        role: "user",
        model_used: modelName,
        metadata: {
          streamed: false,
          parts: messageParts || undefined,
        },
        session_id: sessionId,
        message_id: lastUserMessage.id,
      });

      // Check if there are any active sandboxes no just hit the get endpoint
      const bedrock = getBedrockClient();

      const model = bedrock(CLAUDE_SONNET_4_MODEL);

      // Check if there are any active sandboxes no just hit the get endpoint

      const result = streamText({
        model: model,
        messages: formattedMessages,
        tools: tools,
        toolCallStreaming: true,
        system: getPrompt(fileTree),
        maxSteps: 30,
        onFinish: async () => {
          // Set app status back to active
          try {
            const { error: finalUpdateError } = await supabaseAdmin
              .from("user_sandboxes")
              .update({ app_status: "active" })
              .eq("app_id", trimmedAppId);

            if (finalUpdateError) {
              console.error("Failed to update app status back to active:", finalUpdateError);
            }
          } catch (recoveryError) {
            console.error("Failed to recover app status:", recoveryError);
          }
        }
      });

      return result.toDataStreamResponse({
        sendReasoning: true,
      });
    } catch (error) {
      // Comprehensive error handling
      console.error("Detailed chat error:", error);
      return NextResponse.json(
        {
          error:
            "Internal Server Error: " +
            (error instanceof Error ? error.message : String(error)),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Comprehensive error handling
    console.error("Detailed chat error:", error);
    return NextResponse.json(
      {
        error:
          "Internal Server Error: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
