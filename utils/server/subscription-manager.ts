import { getSupabaseAdmin } from "./supabase-admin";

export interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  messagesLimit: number;
  planName: string;
  messagesUsed: number;
  nextBillingDate: string | null;
  subscriptionType: string;
  canSendMessage: boolean;
}

export async function getOrCreateSubscription(
  userId: string,
): Promise<SubscriptionInfo> {
  const admin = await getSupabaseAdmin();

  // Try to get existing subscription
  let { data: subscription, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  const now = new Date();

  console.log("subscription", subscription);
  // Create free subscription if none exists
  if (error || !subscription) {
    const start = now;
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const { data: newSubscription, error: createError } = await admin
      .from("subscriptions")
      .insert({
        id: `free_${userId}_${Date.now()}`, // Generate unique ID for free subscription
        user_id: userId,
        subscription_type: "free",
        status: "active",
        price_id: "free",
        quantity: 1,
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        messages_used_this_period: 0,
        cancel_at_period_end: false,
        canceled_at: null,
        customer_id: null,
        created_at: now.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw new Error(
        `Failed to create free subscription: ${createError.message}`,
      );
    }

    subscription = newSubscription;
  }

  // Check if subscription is expired and needs renewal (for free tier)
  if (subscription.subscription_type === "free") {
    const endDate = new Date(subscription.current_period_end);
    if (now > endDate) {
      // Renew free subscription
      const newStart = now;
      const newEnd = new Date(now);
      newEnd.setMonth(newEnd.getMonth() + 1);

      const { error: renewError } = await admin
        .from("subscriptions")
        .update({
          current_period_start: newStart.toISOString(),
          current_period_end: newEnd.toISOString(),
          messages_used_this_period: 0,
        })
        .eq("id", subscription.id);

      if (renewError) {
        throw new Error(
          `Failed to renew free subscription: ${renewError.message}`,
        );
      }

      subscription.current_period_start = newStart.toISOString();
      subscription.current_period_end = newEnd.toISOString();
      subscription.messages_used_this_period = 0;
    }
  }

  // Determine limits and status
  const limits = {
    free: Number(process.env.NEXT_PUBLIC_FREE_PLAN_LIMIT) || 20,
    starter: Number(process.env.NEXT_PUBLIC_STARTER_PLAN_LIMIT) || 250,
    pro: -1, // Unlimited
  };

  const planNames = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
  };

  const subscriptionType = subscription.subscription_type || "free";
  const messagesLimit =
    limits[subscriptionType as keyof typeof limits] || limits.free;
  const planName =
    planNames[subscriptionType as keyof typeof planNames] || planNames.free;
  const messagesUsed = subscription.messages_used_this_period || 0;

  // Check if subscription is active
  const isActive =
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due";

  // Check if user can send messages
  const canSendMessage =
    isActive && (messagesLimit === -1 || messagesUsed < messagesLimit);

  return {
    hasActiveSubscription: isActive,
    messagesLimit,
    planName,
    messagesUsed,
    nextBillingDate: subscription.current_period_end,
    subscriptionType,
    canSendMessage,
  };
}

export async function incrementMessageUsage(userId: string): Promise<boolean> {
  const admin = await getSupabaseAdmin();

  const { data: subscription, error } = await admin
    .from("subscriptions")
    .select("id, messages_used_this_period")
    .eq("user_id", userId)
    .single();

  if (error || !subscription) {
    throw new Error("Subscription not found");
  }

  const { error: updateError } = await admin
    .from("subscriptions")
    .update({
      messages_used_this_period:
        (subscription.messages_used_this_period || 0) + 1,
    })
    .eq("id", subscription.id);

  if (updateError) {
    throw new Error(
      `Failed to increment message count: ${updateError.message}`,
    );
  }

  return true;
}

export async function checkSubscription(userId: string): Promise<boolean> {
  try {
    const subscriptionInfo = await getOrCreateSubscription(userId);

    if (!subscriptionInfo.canSendMessage) {
      return false;
    }

    // Increment usage
    await incrementMessageUsage(userId);

    return true;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}
