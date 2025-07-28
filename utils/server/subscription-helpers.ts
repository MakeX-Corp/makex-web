import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { DEFAULT_LIMITS } from "@/const/const";
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

//get limit from const
export function getSubscriptionLimits(subscriptionType: string): {
  messagesLimit: number;
  planName: string;
} {
  const isStarterPlan = subscriptionType === "makex_starter_plan";
  return {
    messagesLimit: isStarterPlan
      ? parseInt(DEFAULT_LIMITS.starter)
      : parseInt(DEFAULT_LIMITS.free),
    planName: isStarterPlan ? "Starter" : "Free",
  };
}

//??? what is this
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

// Main function to get user subscription with all logic combined
export async function getUserSubscription(userId: string) {
  try {
    // Step 1: First try to fetch from mobile_subscriptions table
    const { data: mobileSubscription, error: mobileError } =
      await fetchMobileSubscription(userId);

    // If user found in mobile_subscriptions, return the data
    if (mobileSubscription && !mobileError) {
      return await handleExistingMobileSubscription(mobileSubscription);
    }

    // Step 2: If not found in mobile_subscriptions, check subscriptions table
    const { data: webSubscription, error: webError } =
      await fetchWebSubscription(userId);

    if (webSubscription && !webError) {
      // Step 3: Found in subscriptions table, insert into mobile_subscriptions
      return await handleWebSubscription(webSubscription, userId);
    }

    // Step 4: Not found in either table, create free plan entry
    return await handleNoSubscription(userId);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw error;
  }
}

// Function to check message limits and return limit status
export async function checkMessageLimit(userId: string) {
  try {
    const subscription = await getUserSubscription(userId);

    const remainingMessages = Math.max(
      0,
      subscription.messagesLimit - subscription.messagesUsed,
    );
    const reachedLimit = remainingMessages <= 0;

    return {
      reachedLimit,
      remainingMessages,
      total: subscription.messagesLimit,
      used: subscription.messagesUsed,
      planName: subscription.planName,
      hasActiveSubscription: subscription.hasActiveSubscription,
      nextBillingDate: subscription.nextBillingDate,
    };
  } catch (error) {
    console.error("Error checking message limit:", error);
    throw error;
  }
}

// Function to increment message count for a user
export async function incrementMessageCount(userId: string) {
  try {
    const admin = await getSupabaseAdmin();

    // Get current subscription
    const { data: mobileSubscription, error: fetchError } = await admin
      .from("mobile_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError || !mobileSubscription) {
      // If no subscription found, create one first
      await getUserSubscription(userId);
    }

    // Increment the message count
    const { error: updateError } = await admin
      .from("mobile_subscriptions")
      .update({
        messages_used_this_period:
          mobileSubscription?.messages_used_this_period + 1 || 1,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Failed to increment message count:", updateError);
      throw updateError;
    }
  } catch (error) {
    console.error("Error incrementing message count:", error);
    throw error;
  }
}
