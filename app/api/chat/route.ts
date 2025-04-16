import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { checkDailyMessageLimit } from "@/utils/server/check-daily-limit";
import { createTools } from "@/utils/server/tool-factory";
import { getPrompt } from "@/utils/server/prompt";
// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

// GET /api/chat - Get all messages for a specific session
export async function GET(req: Request) {
  try {
    const userResult = await getSupabaseWithUser(req);
    if (userResult instanceof NextResponse) return userResult;
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
  const { messages, appUrl, appId, sessionId, supabase_project } =
    await req.json();
  // Get the last user message
  const lastUserMessage = messages[messages.length - 1];
  // Get the user API client
  const userResult = await getSupabaseWithUser(req);
  if (userResult instanceof NextResponse) return userResult;
  const { supabase, user } = userResult;

  // Check daily message limit using the new utility function
  const MAX_DAILY_MESSAGES = parseInt(process.env.MAX_DAILY_MESSAGES || "20");
  const limitCheck = await checkDailyMessageLimit(
    supabase,
    user,
    MAX_DAILY_MESSAGES
  );
  if (limitCheck.error) {
    return NextResponse.json(
      { error: limitCheck.error },
      { status: limitCheck.status }
    );
  }
  let imageUrl = null;

  // Check if the last user message has an image and upload it
  if (lastUserMessage?.experimental_attachments?.length > 0) {
    try {
      console.log("Found image attachment in message, attempting to upload...");
      const imageAttachment = lastUserMessage.experimental_attachments[0];

      // Validate it's a base64 image
      if (
        !imageAttachment.url ||
        !imageAttachment.url.startsWith("data:image/")
      ) {
        console.log("Image is not a valid base64 string, skipping upload");
      } else {
        // Extract content type and data from base64
        const contentTypeMatch = imageAttachment.url.match(
          /^data:([^;]+);base64,/
        );
        if (!contentTypeMatch) {
          throw new Error("Invalid base64 image format");
        }

        const contentType = contentTypeMatch[1];
        const base64Data = imageAttachment.url.replace(
          /^data:[^;]+;base64,/,
          ""
        );

        // Validate base64 data
        if (!base64Data || base64Data.trim() === "") {
          throw new Error("Empty base64 data");
        }

        const buffer = Buffer.from(base64Data, "base64");

        // Ensure file extension matches RLS policy
        let fileExt = contentType.split("/")[1] || "png";
        // Normalize extension to ensure it matches policy
        if (
          fileExt === "jpg" ||
          fileExt === "jpeg" ||
          fileExt === "png" ||
          fileExt === "gif"
        ) {
          // Extension is already valid
        } else if (fileExt === "svg+xml") {
          fileExt = "png"; // Convert SVG to allowed type
        } else {
          fileExt = "png"; // Default to png for unsupported types
        }

        // Use same path structure as test upload
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const filename = `${sessionId}/${timestamp}-${randomId}.${fileExt}`;

        console.log(
          `Attempting to upload image to path: ${filename}, content type: ${contentType}, extension: ${fileExt}`
        );

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(filename, buffer, {
            contentType: contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error("Supabase upload error:", JSON.stringify(uploadError));
          throw uploadError;
        }

        console.log("Upload successful:", uploadData);

        // Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from("chat-images")
          .getPublicUrl(filename);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error("Failed to get public URL");
        }

        imageUrl = publicUrlData.publicUrl;
        console.log("Image uploaded successfully to:", imageUrl);
      }
    } catch (error) {
      console.error("Error uploading image to storage:", error);
      // Continue with original message if upload fails
    }
  }

  const apiClient = createFileBackendApiClient(appUrl);
  let connectionUri = undefined;

  if (supabase_project) {
    connectionUri = `postgresql://postgres.${supabase_project.id}:${supabase_project.db_pass}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  }

  // Get the file tree first
  const fileTreeResponse = await apiClient.get("/file-tree", { path: "." });
  const fileTree = fileTreeResponse.data;

  const modelName = "claude-3-5-sonnet-latest";

  const tools = createTools({
    apiUrl: appUrl,
    connectionUri: connectionUri,
  });

  const formattedMessages = messages.map((message: any) => {
    // If message has attachments, format them as image parts
    if (message.experimental_attachments?.length) {
      return {
        role: message.role,
        content: [
          { type: "text", text: message.content || "" },
          ...message.experimental_attachments.map((attachment: any) => ({
            type: "image",
            image: attachment.url,
          })),
        ],
      };
    }

    // Regular text message
    return {
      role: message.role,
      content: message.content,
    };
  });
  const result = streamText({
    model: anthropic(modelName),
    messages: formattedMessages,
    tools: tools,
    system: getPrompt(fileTree, connectionUri),
    onFinish: async (result) => {
      // Save checkpoint after completing the response
      const inputTokens = result.usage.promptTokens;
      const inputCost = inputTokens * 0.000003;
      // Insert user's last message into chat history
      await supabase.from("app_chat_history").insert({
        app_id: appId,
        user_id: user.id,
        content: lastUserMessage.content,
        role: "user",
        model_used: modelName,
        metadata: { streamed: false, imageUrl: imageUrl || null }, //save image url in the metadata
        input_tokens_used: inputTokens,
        output_tokens_used: 0,
        cost: inputCost,
        session_id: sessionId,
        message_id: lastUserMessage.id,
      });
    },
    maxSteps: 30, // allow up to 30 steps
  });
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
