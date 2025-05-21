import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { checkMessageLimit } from "@/utils/server/check-daily-limit";
import { createTools } from "@/utils/server/tool-factory";
import { getPrompt } from "@/utils/server/prompt";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
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
      .eq("id", appId)
      .single();

    if (appError) {
      return NextResponse.json(
        { error: "Failed to fetch app details" },
        { status: 500 }
      );
    }

   
    const apiClient = createFileBackendApiClient(app.api_url);
    let connectionUri = undefined;

    if (supabase_project) {
      connectionUri = `postgresql://postgres.${supabase_project.id}:${supabase_project.db_pass}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    }

    // Get the file tree
    const fileTreeResponse = await apiClient.get("/file-tree", { path: "." });
    const fileTree = fileTreeResponse;

    const modelName = "claude-3-5-sonnet-latest";

    const tools = createTools({
      apiUrl: app.api_url,
      connectionUri: connectionUri,
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
      app_id: appId,
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
    const bedrock = createAmazonBedrock({
      region: "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const model = bedrock("us.anthropic.claude-3-5-sonnet-20241022-v2:0");

    // Check if there are any active sandboxes no just hit the get endpoint

    const result = streamText({
      model: model,
      messages: formattedMessages,
      tools: tools,
      toolCallStreaming: true,
      system: getPrompt(fileTree, connectionUri),
      maxSteps: 30,
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
}
