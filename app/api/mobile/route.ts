import { NextResponse } from "next/server";
import { aiAgent } from "@/trigger/ai-agent";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userResult = await getSupabaseWithUser(request);
    if (userResult instanceof NextResponse) return userResult;
    if ("error" in userResult) return userResult.error;

    const body = await request.json();
    const { appId, userPrompt } = body;

    if (!appId || !userPrompt) {
      return NextResponse.json(
        { error: "Missing required fields: appId and userPrompt" },
        { status: 400 }
      );
    }
    const supabase = await getSupabaseAdmin();
    // Update sandbox status to changing
    const { error: updateError } = await supabase
      .from("user_sandboxes")
      .update({ app_status: "changing" })
      .eq("app_id", appId);

    if (updateError) {
      throw new Error("Failed to update sandbox status");
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
