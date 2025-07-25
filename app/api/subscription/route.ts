import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import {
  fetchMobileSubscription,
  fetchWebSubscription,
  handleExistingMobileSubscription,
  handleWebSubscription,
  handleNoSubscription,
} from "@/utils/server/subscription-helpers";

export async function GET(request: Request) {
  // Get authenticated user and Supabase client
  const result = await getSupabaseWithUser(request as NextRequest);

  if (result instanceof NextResponse || "error" in result) {
    return result; // This handles auth errors automatically
  }

  const { user } = result;

  try {
    // Step 1: First try to fetch from mobile_subscriptions table
    const { data: mobileSubscription, error: mobileError } =
      await fetchMobileSubscription(user.id);

    console.log("mobileSubscription", mobileSubscription);
    // If user found in mobile_subscriptions, return the data
    if (mobileSubscription && !mobileError) {
      const response = await handleExistingMobileSubscription(
        mobileSubscription,
      );
      return NextResponse.json(response);
    }

    // Step 2: If not found in mobile_subscriptions, check subscriptions table
    const { data: webSubscription, error: webError } =
      await fetchWebSubscription(user.id);

    if (webSubscription && !webError) {
      // Step 3: Found in subscriptions table, insert into mobile_subscriptions
      const response = await handleWebSubscription(webSubscription, user.id);
      return NextResponse.json(response);
    }

    // Step 4: Not found in either table, create free plan entry
    const response = await handleNoSubscription(user.id);
    return NextResponse.json(response);
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
