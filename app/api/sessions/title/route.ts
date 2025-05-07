// File: app/api/sessions/title/route.js
import { getSupabaseWithUser } from "@/utils/server/auth";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const summarizeChat = async (content: string) => {
  try {
    if (!content || content.trim().length === 0) {
      return "New Chat";
    }

    const result = await streamText({
      model: anthropic("claude-3-haiku-20240307"),
      messages: [
        {
          role: "user",
          content: `Create a short title (3 words or fewer) for this conversation: ${content.substring(
            0,
            2000
          )}`,
        },
      ],
      system:
        "Generate a short title (3 words or fewer) that captures the essence of this conversation. Respond with only the title.",
      maxTokens: 30,
    });

    // Collect the full text from the stream
    let title = "";
    const textStream = await result.textStream;
    for await (const chunk of textStream) {
      title += chunk;
    }

    return title.trim() || "New Chat";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Chat";
  }
};
export async function PUT(request: Request) {
  try {
    const result = await getSupabaseWithUser(request as NextRequest);
    if (result instanceof NextResponse || 'error' in result ) return result;

    const { supabase, user } = result;

    // Get request body
    const { sessionId, title, isAiGenerated, content } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id, title")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }
    //Make title if it is ai generated
    let formattedTitle = "";
    //@ts-ignore
    if (
      isAiGenerated &&
      content &&
      (session?.title === "New Chat" || !session?.title)
    ) {
      // summarizing the chat
      formattedTitle = await summarizeChat(content);
    } else {
      // Sanitize title - If empty, use "New Chat"
      formattedTitle = (title || "").trim() || session?.title;
    }
    // Update session title in database
    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ title: formattedTitle })
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
