import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getMessageCount } from "@/utils/server/check-daily-limit"; // Import existing function

// Default message limits for each plan
const DEFAULT_LIMITS = {
  free: 5, // 5 messages per day
  starter: 250, // 250 messages per month
  pro: 500, // 500 messages per month
};

/**
 * Get message usage stats based on subscription plan using POST method
 * Allows passing subscription data in the request body
 */
export async function POST(req: Request) {
  try {
    // Get the user API client
    const userResult = await getSupabaseWithUser(req);
    if (userResult instanceof NextResponse) return userResult;
    const { supabase, user } = userResult;

    // Get subscription data from request body
    let subscriptionData = null;
    try {
      const body = await req.json();
      subscriptionData = body.subscription || null;
    } catch (e) {
      console.warn("Failed to parse request body", e);
      // Continue with null subscriptionData
    }
    // Extract plan info with fallbacks
    const planName = (subscriptionData?.planName || "free").toLowerCase();
    let limit, startDate, endDate, periodType;

    // Set appropriate limits and time periods based on plan
    if (
      planName === "free" ||
      !["starter", "pro"].includes(planName) ||
      !subscriptionData?.subscription?.current_period_start ||
      !subscriptionData?.subscription?.current_period_end ||
      subscriptionData?.subscription?.status !== "active"
    ) {
      // Free plan or invalid subscription: daily limit
      limit = DEFAULT_LIMITS.free;

      const now = new Date();
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      periodType = "daily";
    } else {
      // Paid plans with valid subscription: billing period limit
      limit =
        planName === "starter" ? DEFAULT_LIMITS.starter : DEFAULT_LIMITS.pro;
      startDate = new Date(subscriptionData.subscription.current_period_start);
      endDate = new Date(subscriptionData.subscription.current_period_end);
      periodType = "monthly";
    }

    // Get message count for the determined period
    const result = await getMessageCount(supabase, user.id, startDate, endDate);
    if (result.error) {
      return NextResponse.json(
        { error: "Failed to fetch message count" },
        { status: 500 }
      );
    }

    const used = result.count || 0;

    // Return usage info
    return NextResponse.json({
      remaining: Math.max(0, limit - used), // Ensure remaining is never negative
      total: limit,
      used: used,
      resetDate: endDate.toISOString(),
      periodType: periodType,
    });
  } catch (error) {
    console.error("Error in message count API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
