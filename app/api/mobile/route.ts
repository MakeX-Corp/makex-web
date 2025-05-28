import { NextResponse } from "next/server";
import { aiAgent } from "@/trigger/ai-agent";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    // const userResult = await getSupabaseWithUser(request);
    // if (userResult instanceof NextResponse) return userResult;
    // if ('error' in userResult) return userResult.error;

    const body = await request.json();
    const { appId, userPrompt } = body;

    if (!appId || !userPrompt) {
      return NextResponse.json(
        { error: "Missing required fields: appId and userPrompt" },
        { status: 400 }
      );
    }

    // Trigger the AI agent task
    const result = await aiAgent.trigger({
      appId,
      userPrompt,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Mobile API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
