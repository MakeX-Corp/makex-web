// File: app/api/sessions/title/route.js
import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function PUT(request: Request) {
  try {
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;

    const { supabase, user } = result;

    // Get request body
    const { sessionId, title } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Sanitize title - If empty, use "New Chat"
    const sanitizedTitle = (title || "").trim() || "New Chat";

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update session title in database
    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ title: sanitizedTitle })
      .eq("id", sessionId)
      .select("id, title")
      .single();

    if (error) {
      console.error("Error updating session title:", error);
      return NextResponse.json(
        { error: "Failed to update session title" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Session title update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
