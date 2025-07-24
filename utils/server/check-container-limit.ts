import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function checkActiveContainer(supabase: SupabaseClient, userId: string) {
  // Get the user's most recent active subscription
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (subscriptionError && subscriptionError.code !== "PGRST116") {
    return NextResponse.json({ error: "Failed to check subscription status" }, { status: 500 });
  }

  // Determine the container limit based on the subscription
  let maxContainers: number;
  if (!subscription) {
    // Free plan
    maxContainers = parseInt(process.env.NEXT_PUBLIC_FREE_CONTAINERS || "1", 10);
  } else {
    switch (subscription.price_id) {
      case process.env.NEXT_PUBLIC_PADDLE_STARTER_ID:
        maxContainers = parseInt(process.env.NEXT_PUBLIC_STARTER_CONTAINERS || "3", 10);
        break;
      case process.env.NEXT_PUBLIC_PADDLE_PRO_ID:
        // Pro plan has unlimited containers
        return null;
      default:
        // Default to free plan limit
        maxContainers = parseInt(process.env.NEXT_PUBLIC_FREE_CONTAINERS || "1", 10);
    }
  }

  // Get active containers
  const { data: activeContainers, error } = await supabase
    .from("user_apps")
    .select("*")
    .eq("user_id", userId)
    .or("status.is.null,status.neq.deleted");

  if (error) {
    return NextResponse.json({ error: "Failed to check active containers" }, { status: 500 });
  }

  if (activeContainers && activeContainers.length >= maxContainers) {
    return NextResponse.json(
      {
        error: `Maximum container limit reached (${maxContainers})`,
        currentCount: activeContainers.length,
        maxAllowed: maxContainers,
      },
      { status: 400 }
    );
  }

  return activeContainers;
}
