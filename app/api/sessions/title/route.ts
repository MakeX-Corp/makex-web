// File: app/api/sessions/title/route.js
import { CLAUDE_SONNET_4_MODEL } from "@/const";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { gateway } from "@/utils/server/gateway";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Schema for title generation
const titleSchema = z.object({
  title: z
    .string()
    .describe(
      "A short title (3 words or fewer) that captures the essence of the conversation",
    ),
});

const summarizeChat = async (content: string) => {
  try {
    if (!content || content.trim().length === 0) {
      return "New Chat";
    }

    const { object } = await generateObject({
      model: gateway(CLAUDE_SONNET_4_MODEL),
      providerOptions: {
        gateway: {
          order: ["anthropic", "bedrock", "vertex"],
        },
      },
      schema: titleSchema,
      prompt: `Analyze this conversation and create a short title (3 words or fewer) that captures its essence. Return ONLY the title as a JSON object with a "title" field.

Conversation: ${content.substring(0, 2000)}

Return format: {"title": "Your Title Here"}`,
      system:
        "You are a title generator. Always respond with valid JSON containing a 'title' field with a short, descriptive title (3 words or fewer).",
    });

    return object.title.trim() || "New Chat";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Chat";
  }
};
export async function PUT(request: Request) {
  try {
    const result = await getSupabaseWithUser(request as NextRequest);
    if (result instanceof NextResponse || "error" in result) return result;

    const { supabase, user } = result;

    // Get request body
    const { sessionId, title, isAiGenerated, content } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
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
        { status: 404 },
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
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Session title update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
