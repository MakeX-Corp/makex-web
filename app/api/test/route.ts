import { NextResponse } from "next/server";
import { generateText } from "ai";
import { gateway } from "@/utils/server/gateway";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 }
      );
    }

    // Generate text using AI gateway
    const result = await generateText({
      model: gateway(CLAUDE_SONNET_4_MODEL),
      providerOptions: {
        gateway: {
          order: ["anthropic", "bedrock", "vertex"],
        },
      },
      messages: [{ role: "user", content: prompt }],
      system: "You are a helpful AI assistant. Provide clear, concise responses.",
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    });

  } catch (error) {
    console.error("Error generating text:", error);
    return NextResponse.json(
      { error: "Failed to generate text", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
