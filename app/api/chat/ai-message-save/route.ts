import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const userResult = await getSupabaseWithUser(request as NextRequest);
    if (userResult instanceof NextResponse || 'error' in userResult) return userResult;
    const { supabase, user } = userResult;

    const body = await request.json();
    const { appId, sessionId, options, message } = body;

    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("*")
      .eq("id", appId)
      .single();

    if (appError) {
      return NextResponse.json({ error: "Failed to fetch app details" }, { status: 500 });
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

    // Insert assistant's message into chat history
    await supabase.from("app_chat_history").insert({
      app_id: appId,
      user_id: user.id, // Use authenticated user's ID
      content: message.content,
      role: "assistant",
      model_used: "claude-3-5-sonnet-latest",
      metadata: message,
      session_id: sessionId,
      commit_hash: commitHash,
      message_id: message.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving AI message:", error);
    return NextResponse.json(
      { error: "Failed to save AI message" },
      { status: 500 }
    );
  }
}
