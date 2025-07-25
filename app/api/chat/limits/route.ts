import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth"; // Import existing function
import { DEFAULT_LIMITS } from "@/const/const";

/**
 * Get message usage stats based on subscription plan using POST method
 * Allows passing subscription data in the request body
 */
export async function POST(req: Request) {
  try {
    // Get the user API client
    const userResult = await getSupabaseWithUser(req as NextRequest);
    if (userResult instanceof NextResponse || "error" in userResult)
      return userResult;
    const { supabase, user } = userResult;

    //check if user is in mobile subscriptions table, get that message count if so
    // if not in mobile subscription table, i guess just manually calculate the message count

    // ok but say we insert him into mobile_subscriptions table , then what?
    // if they buy a subscription from  paddle then mobile subscriptions will never know right?
    // or maybe next time you send a message it will update mobile subscriptions table?

    // Get subscription data from request body
    let subscriptionData = null;
    try {
      const body = await req.json();
      subscriptionData = body.subscription || null;
      console.log("subscriptionData", subscriptionData);
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
      endDate = new Date();
      startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1);
      periodType = "monthly";
    } else {
      // Paid plans with valid subscription: billing period limit
      limit =
        planName === "starter" ? DEFAULT_LIMITS.starter : DEFAULT_LIMITS.pro;
      startDate = new Date(subscriptionData.subscription.current_period_start);
      endDate = new Date(subscriptionData.subscription.current_period_end);
      periodType = "monthly";
    }

    // Get message count for the determined period
    //const result = await getMessageCount(supabase, user.id, startDate, endDate);
    const result = { count: 0, error: null };
    if (result.error) {
      return NextResponse.json(
        { error: "Failed to fetch message count" },
        { status: 500 },
      );
    }

    const used = result.count || 0;

    //check if user is in mobile subscriptions table, get that message count if so
    // if not in mobile subscription table, i guess just manually calculate the message count

    // ok but say we insert him into mobile_subscriptions table , then what?
    // if they buy a subscription from  paddle then mobile subscriptions will never know right?
    // or maybe next time you send a message it will update mobile subscriptions table?

    // Return usage info
    return NextResponse.json({
      remaining: Math.max(0, parseInt(limit) - used), // Ensure remaining is never negative
      total: limit,
      used: used,
      resetDate: endDate.toISOString(),
      periodType: periodType,
    });
  } catch (error) {
    console.error("Error in message count API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
