import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

// Types for better type safety
export interface SubscriptionData {
  subscription_type: string;
  subscription_status: string;
  subscription_end: string;
  messages_used_this_period: number;
}

export interface SubscriptionResponse {
  hasActiveSubscription: boolean;
  messagesLimit: number;
  planName: string;
  nextBillingDate: string;
  messagesUsed: number;
  subscription: any;
}

// Utility functions
export function getSubscriptionLimits(subscriptionType: string): {
  messagesLimit: number;
  planName: string;
} {
  const isStarterPlan = subscriptionType === "makex_starter_plan";
  return {
    messagesLimit: isStarterPlan ? 250 : 20,
    planName: isStarterPlan ? "Starter" : "Free",
  };
}

export function formatSubscriptionResponse(
  subscription: SubscriptionData,
): SubscriptionResponse {
  const { messagesLimit, planName } = getSubscriptionLimits(
    subscription.subscription_type,
  );

  return {
    hasActiveSubscription: subscription.subscription_status === "active",
    messagesLimit,
    planName,
    nextBillingDate: subscription.subscription_end,
    messagesUsed: subscription.messages_used_this_period,
    subscription,
  };
}

export function isSubscriptionExpired(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

// Database operations
export async function fetchMobileSubscription(userId: string) {
  const admin = await getSupabaseAdmin();
  return await admin
    .from("mobile_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
}

export async function fetchWebSubscription(userId: string) {
  const admin = await getSupabaseAdmin();
  return await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
}

export async function insertMobileSubscription(subscriptionData: any) {
  const admin = await getSupabaseAdmin();
  const { error } = await admin
    .from("mobile_subscriptions")
    .insert(subscriptionData);

  if (error) {
    console.error("Failed to insert mobile subscription:", error);
    throw error;
  }
}

export function createFreeSubscriptionData(userId: string) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  return {
    user_id: userId,
    subscription_type: "free",
    subscription_status: "inactive",
    subscription_start: now.toISOString(),
    subscription_end: endDate.toISOString(),
    messages_used_this_period: 0,
  };
}

export function mapWebToMobileSubscription(
  webSubscription: any,
  userId: string,
) {
  const isExpired = isSubscriptionExpired(webSubscription.current_period_end);
  const subscriptionStatus = isExpired ? "inactive" : "active";

  return {
    user_id: userId,
    subscription_type:
      webSubscription.price_id === process.env.NEXT_PUBLIC_PADDLE_STARTER_ID
        ? "makex_starter_plan"
        : "free",
    subscription_status: subscriptionStatus,
    subscription_start: webSubscription.current_period_start,
    subscription_end: webSubscription.current_period_end,
    messages_used_this_period: 0,
    last_transaction_id: webSubscription.id,
  };
}

// Main subscription logic
export async function handleExistingMobileSubscription(
  mobileSubscription: SubscriptionData,
) {
  return {
    hasActiveSubscription: mobileSubscription.subscription_status === "active",
    messagesLimit: getSubscriptionLimits(mobileSubscription.subscription_type)
      .messagesLimit,
    planName: getSubscriptionLimits(mobileSubscription.subscription_type)
      .planName,
    nextBillingDate: mobileSubscription.subscription_end,
    messagesUsed: mobileSubscription.messages_used_this_period,
    subscription: mobileSubscription,
  };
}

export async function handleWebSubscription(
  webSubscription: any,
  userId: string,
) {
  const mobileSubscriptionData = mapWebToMobileSubscription(
    webSubscription,
    userId,
  );

  await insertMobileSubscription(mobileSubscriptionData);

  return formatSubscriptionResponse(mobileSubscriptionData);
}

export async function handleNoSubscription(userId: string) {
  const freeSubscriptionData = createFreeSubscriptionData(userId);

  await insertMobileSubscription(freeSubscriptionData);

  return formatSubscriptionResponse(freeSubscriptionData);
}
