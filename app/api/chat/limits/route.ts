import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { checkMessageLimit } from "@/utils/server/subscription-helpers";

/**
 * Get message usage stats and limit information
 * Uses the unified subscription system
 */
export async function POST(req: Request) {
  try {
    // Get the user API client
    const userResult = await getSupabaseWithUser(req as NextRequest);
    if (userResult instanceof NextResponse || "error" in userResult)
      return userResult;
    const { user } = userResult;

    // Use the unified checkMessageLimit function
    const result = await checkMessageLimit(user.id);

    return NextResponse.json({
      remaining: result.remainingMessages,
      total: result.total,
      used: result.used,
      planName: result.planName,
      hasActiveSubscription: result.hasActiveSubscription,
      nextBillingDate: result.nextBillingDate,
      reachedLimit: result.reachedLimit,
    });
  } catch (error) {
    console.error("Error in message limits API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
