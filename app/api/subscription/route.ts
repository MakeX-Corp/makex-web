import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import {
  getOrCreateSubscription,
  SubscriptionInfo,
} from "@/utils/server/subscription-manager";

export async function GET(request: Request) {
  // Get authenticated user and Supabase client
  const result = await getSupabaseWithUser(request as NextRequest);

  if (result instanceof NextResponse || "error" in result) {
    return result; // This handles auth errors automatically
  }

  const { user } = result;

  try {
    // Use the subscription manager to get or create subscription
    let subscriptionInfo: SubscriptionInfo = await getOrCreateSubscription(
      user.id,
    );

    // Override with unlimited access in development
    if (process.env.NODE_ENV === "development") {
      subscriptionInfo = {
        ...subscriptionInfo,
        messagesUsed: 0,
        canSendMessage: true,
      };
    }

    return NextResponse.json({ ...subscriptionInfo, userId: user.id });
  } catch (error) {
    console.error("Error fetching subscription:", error);

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: "Failed to fetch subscription",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
