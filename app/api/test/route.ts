import { NextResponse } from "next/server";
import { generateText, convertToModelMessages } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";

export async function POST(request: Request) {
  try {
    // Hardcoded prompt regardless of input
    const prompt = "I don't hear you";
    const messages = [
      { role: "user" as const, parts: [{ type: "text" as const, text: prompt }] }
    ];
    const result = await generateText({
      model: gateway(CLAUDE_SONNET_4_MODEL),
      providerOptions: {
        gateway: {
          order: ['vertex', 'bedrock', 'anthropic'],
        },
      },
      messages: convertToModelMessages(messages),
    });
    console.log("Result:", result);
    console.log('Provider metadata:', JSON.stringify(await result.providerMetadata, null, 2));
    return NextResponse.json({ text: result.text });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
