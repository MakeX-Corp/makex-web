import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const userResult = await getSupabaseWithUser(request as NextRequest);
    if (userResult instanceof NextResponse || "error" in userResult)
      return userResult;
    const { supabase, user } = userResult;

    const body = await request.json();
    const { appId, sessionId, options, message } = body;

    console.log("[AI Message Save] Message first part:", message);

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

    const apiUrl = app.api_url;

    let commitHash = null;

    const apiClient = createFileBackendApiClient(apiUrl);
    // Save checkpoint after completing the response
    try {
      const checkpointResponse = await apiClient.post("/checkpoint/save", {
        name: "ai-assistant-checkpoint",
        message: "Checkpoint after AI assistant changes",
      });
      console.log("checkpointResponse", checkpointResponse);
      // Store the commit hash from the response
      commitHash =
        checkpointResponse.commit || checkpointResponse.current_commit;
    } catch (error) {
      console.error("Failed to save checkpoint:", error);
      throw error;
    }

    console.log("[AI Message Save] Message:", message);
    const content = message.parts?.map((p: any) => p.text).join(" ") ?? "";
    console.log("[AI Message Save] Content:", content);
    // Insert assistant's message into chat history
    const { data, error } = await supabase.from("app_chat_history").insert({
      app_id: appId,
      user_id: user.id, // Use authenticated user's ID
      content: content,
      role: "assistant",
      model_used: CLAUDE_SONNET_4_MODEL,
      metadata: message,
      session_id: sessionId,
      commit_hash: commitHash,
      message_id: message.id,
    });

    console.log("[AI Message Save] Data:", data);
    console.log("[AI Message Save] Error:", error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving AI message:", error);
    return NextResponse.json(
      { error: "Failed to save AI message" },
      { status: 500 }
    );
  }
}
