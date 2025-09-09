import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse, NextRequest } from "next/server";
import { restoreCheckpoint } from "@/utils/server/e2b";

// Add this function to handle checkpoint restore
export async function POST(request: Request) {
  const { messageId, appId, sessionId } = await request.json();

  // query supabase chat_history to get the commit hash
  const userResult = await getSupabaseWithUser(request as NextRequest);
  if (userResult instanceof NextResponse) return userResult;
  if ("error" in userResult) return userResult.error;
  const { supabase, user } = userResult;
  const { data, error } = await supabase
    .from("chat_history")
    .select("commit_hash")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to get commit hash" },
      { status: 500 },
    );
  }

  // get the sandbox id from user_sandboxes
  const { data: sandboxData, error: sandboxError } = await supabase
    .from("user_sandboxes")
    .select("sandbox_id")
    .eq("user_id", user.id)
    .eq("app_id", appId)
    .single();

  if (sandboxError) {
    return NextResponse.json(
      { error: "Failed to get sandbox details" },
      { status: 500 },
    );
  }

  if (!sandboxData?.sandbox_id) {
    return NextResponse.json(
      { error: "No sandbox found for this app" },
      { status: 404 },
    );
  }

  try {
    const responseData = await restoreCheckpoint(sandboxData.sandbox_id, {
      branch: "master",
      name: data.commit_hash,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error restoring checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to restore checkpoint" },
      { status: 500 },
    );
  }
}
