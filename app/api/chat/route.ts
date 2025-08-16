import {
  convertToModelMessages,
  createIdGenerator,
  stepCountIs,
  streamText,
} from "ai";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { incrementMessageUsage } from "@/utils/server/subscription-manager";
import { createTools } from "@/utils/server/tool-factory";
import { getPrompt } from "@/utils/server/prompt";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { gateway, getModelAndOrder } from "@/utils/server/gateway";
import { extractPlainText } from "@/utils/server/message-helpers";
import { generateCheckpointInfo } from "@/utils/server/checkpoint-generator";
import { saveCheckpoint, getDirectoryTree } from "@/utils/server/e2b";

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

// GET /api/chat - Get all messages for a specific session
export async function GET(req: Request) {
  try {
    const userResult = await getSupabaseWithUser(req as NextRequest);
    if (userResult instanceof NextResponse) return userResult;
    if ("error" in userResult) return userResult.error;
    const { supabase, user } = userResult;

    // Get session ID from query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const appId = searchParams.get("appId");

    if (!sessionId || !appId) {
      return NextResponse.json(
        { error: "Session ID and App ID are required" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Get all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from("chat_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("app_id", appId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      appId,
      sessionId,
      subscription,
      model,
      hasUnlimitedMessages,
    } = await req.json();

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    // Get the user API client
    const userResult = await getSupabaseWithUser(req as NextRequest);
    if (userResult instanceof NextResponse || "error" in userResult)
      return userResult;

    const { supabase, user, token } = userResult;

    // Check if app is already being changed
    const { data: appStatus, error: statusError } = await supabase
      .from("user_apps")
      .select("coding_status")
      .eq("id", appId)
      .single();

    if (statusError) {
      return NextResponse.json(
        { error: "Failed to check app status" },
        { status: 500 },
      );
    }

    if (appStatus?.coding_status === "changing") {
      return NextResponse.json(
        { error: "App is currently being modified. Please try again later." },
        { status: 409 },
      );
    }

    // Lock the app
    const trimmedAppId = appId.trim();

    const supabaseAdmin = await getSupabaseAdmin();
    const { error: lockError, data: lockData } = await supabaseAdmin
      .from("user_apps")
      .update({
        coding_status: "changing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", trimmedAppId)
      .select();

    // Check if we actually found and updated a record
    if (!lockError && (!lockData || lockData.length === 0)) {
      console.warn(`No record found to update for app_id: ${trimmedAppId}`);
    }

    if (lockError) {
      return NextResponse.json(
        { error: "Failed to lock app" },
        { status: 500 },
      );
    }

    try {
      // Check subscription using existing data and increment usage
      const canSendMessage =
        process.env.NODE_ENV === "development" || hasUnlimitedMessages
          ? true
          : subscription?.canSendMessage;

      if (!canSendMessage) {
        return NextResponse.json(
          {
            error:
              "Message limit reached. Please upgrade your plan to continue chatting.",
            limitReached: true,
          },
          { status: 429 },
        );
      }
      if (process.env.NODE_ENV !== "development" && !hasUnlimitedMessages) {
        await incrementMessageUsage(user.id);
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
          { status: 500 },
        );
      }

      // get sandbox from the database
      const { data: sandbox, error: sandboxError } = await supabase
        .from("user_sandboxes")
        .select("sandbox_id")
        .eq("app_id", trimmedAppId)
        .single();

      if (sandboxError) {
        return NextResponse.json(
          { error: "Failed to fetch sandbox details" },
          { status: 500 },
        );
      }

      if (!sandbox?.sandbox_id) {
        return NextResponse.json(
          { error: "No sandbox found for this app" },
          { status: 404 },
        );
      }

      // Get the file tree using E2B
      const fileTreeResponse = await getDirectoryTree(sandbox.sandbox_id);
      const fileTree = fileTreeResponse.tree || "";

      const modelName = model || "claude-4-sonnet-latest";

      const tools = createTools({
        sandboxId: sandbox.sandbox_id,
      });

      const plainText = extractPlainText(lastUserMessage.parts);

      const { data: chatHistoryData, error: chatHistoryError } = await supabase
        .from("chat_history")
        .insert({
          app_id: trimmedAppId,
          user_id: user.id,
          plain_text: plainText,
          parts: lastUserMessage.parts,
          role: "user",
          model_used: modelName,
          session_id: sessionId,
          message_id: lastUserMessage.id,
        });

      // Get model configuration from helper function

      const { model: gatewayModel, order: providerOrder } =
        getModelAndOrder(modelName);

      const result = streamText({
        model: gateway(gatewayModel),
        providerOptions: {
          gateway: {
            order: providerOrder,
          },
        },
        messages: convertToModelMessages(messages),
        tools: tools,
        system: getPrompt(fileTree),
        stopWhen: stepCountIs(100),
        experimental_telemetry: { isEnabled: true },
      });

      return result.toUIMessageStreamResponse({
        originalMessages: messages,
        generateMessageId: createIdGenerator({
          size: 16,
        }),
        onFinish: async ({ responseMessage }) => {
          try {
            const plainText = extractPlainText(responseMessage.parts);
            let commitHash = null;
            try {
              const checkpointInfo = await generateCheckpointInfo(plainText);
              const checkpointResponse = await saveCheckpoint(
                sandbox.sandbox_id,
                {
                  branch: "master",
                  message: checkpointInfo.message,
                },
              );
              console.log("checkpointResponse", checkpointResponse);
              // Store the commit hash from the response
              commitHash =
                checkpointResponse.commit || checkpointResponse.current_commit;
            } catch (error) {
              console.error("Failed to save checkpoint:", error);
            }

            await supabase.from("chat_history").insert({
              app_id: trimmedAppId,
              user_id: user.id,
              plain_text: plainText,
              role: "assistant",
              model_used: modelName,
              parts: responseMessage.parts,
              session_id: sessionId,
              commit_hash: commitHash,
              message_id: responseMessage.id,
            });

            await supabaseAdmin
              .from("user_apps")
              .update({ coding_status: "finished" })
              .eq("id", appId);
          } catch (err) {
            console.error(
              "Exception while updating coding_status to active:",
              err,
            );
          }
        },
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
        { status: 500 },
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
      { status: 500 },
    );
  }
}
