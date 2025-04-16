import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function GET(request: Request) {
  // Get authenticated user and Supabase client
  const result = await getSupabaseWithUser(request);

  if (result instanceof NextResponse) {
    return result; // This handles auth errors automatically
  }

  const { supabase, user } = result;

  try {
    // Get the user's most recent active subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"]) // Only get active-like subscriptions
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Check if it's a not found error (which is expected for users with no subscription)
      if (error.code === "PGRST116") {
        // Return a 200 with null data to indicate no subscription found
        return NextResponse.json({
          subscription: null,
          hasActiveSubscription: false,
          message: "No active subscription found",
        });
      }

      // For other errors, throw to be caught by the catch block
      throw error;
    }

    // Check if subscription is past the current period end date
    const isExpired =
      subscription && new Date(subscription.current_period_end) < new Date();

    // Get any pending or scheduled cancellations
    let pendingCancellation = false;
    if (subscription && subscription.cancel_at_period_end) {
      pendingCancellation = true;
    }
    // Return subscription details with additional useful flags
    return NextResponse.json({
      subscription,
      hasActiveSubscription: subscription && !isExpired,
      pendingCancellation,
      expiresAt: subscription?.current_period_end || null,
      planId: subscription?.price_id || null,
      customerId: subscription?.customer_id || null,
      userId: user.id,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: "Failed to fetch subscription",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
