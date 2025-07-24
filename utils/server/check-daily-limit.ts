import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";
import { DEFAULT_LIMITS } from "@/const/const";

export async function getMessageCount(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ count: number | null; error: any }> {
  const { count, error } = await supabase
    .from("app_chat_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", startDate.toISOString())
    .lt("created_at", endDate.toISOString());

  return { count, error };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function checkMessageLimit(
  supabase: SupabaseClient,
  user: User,
  subscriptionData: any
): Promise<{ error?: string; status?: number }> {
  try {
    // Extract plan info with fallbacks
    const planName = (subscriptionData?.planName || "free").toLowerCase();

    // Handle different plan types
    if (planName === "free") {
      return await checkDailyLimit(supabase, user, DEFAULT_LIMITS.free);
    } else if (["starter", "pro"].includes(planName)) {
      // Get correct limit based on plan
      const limit = planName === "starter" ? DEFAULT_LIMITS.starter : DEFAULT_LIMITS.pro;

      // Check if we have valid subscription period data
      if (
        subscriptionData?.subscription?.current_period_start &&
        subscriptionData?.subscription?.current_period_end &&
        subscriptionData?.subscription?.status === "active"
      ) {
        return await checkBillingPeriodLimit(
          supabase,
          user,
          limit,
          new Date(subscriptionData.subscription.current_period_start),
          new Date(subscriptionData.subscription.current_period_end)
        );
      } else {
        // Fall back to daily limit if no valid subscription period data
        console.warn(
          `Missing or invalid subscription period data for ${planName} plan, falling back to daily check`
        );
        return await checkDailyLimit(supabase, user, DEFAULT_LIMITS.free);
      }
    } else {
      // Unknown plan type, fall back to free
      console.warn(`Unknown plan type: ${planName}, falling back to free plan limits`);
      return await checkDailyLimit(supabase, user, DEFAULT_LIMITS.free);
    }
  } catch (error) {
    console.error("Error checking message limit:", error);
    return {
      error:
        "Failed to check message limit: " +
        (error instanceof Error ? error.message : String(error)),
      status: 500,
    };
  }
}

async function checkDailyLimit(
  supabase: SupabaseClient,
  user: User,
  limit: number
): Promise<{ error?: string; status?: number }> {
  // Calculate today's midnight and tomorrow's midnight
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);

  // Get message count for today
  const result = await getMessageCount(supabase, user.id, todayMidnight, tomorrowMidnight);

  if (result.error) {
    return {
      error: "Failed to check daily message limit",
      status: 500,
    };
  }

  // Check if limit exceeded
  if (result.count !== null && result.count >= limit) {
    return {
      error: `Daily message limit reached (${result.count}/${limit}). Please try again tomorrow or upgrade your plan.`,
      status: 429,
    };
  }

  return {}; // No errors, under limit
}

async function checkBillingPeriodLimit(
  supabase: SupabaseClient,
  user: User,
  limit: number,
  periodStart: Date,
  periodEnd: Date
): Promise<{ error?: string; status?: number }> {
  // Get message count for the current billing period
  const result = await getMessageCount(supabase, user.id, periodStart, periodEnd);

  if (result.error) {
    return {
      error: "Failed to check billing period message limit",
      status: 500,
    };
  }

  // Check if limit exceeded
  if (result.count !== null && result.count >= limit) {
    const formattedEndDate = formatDate(periodEnd);

    return {
      error: `Monthly message limit reached (${result.count}/${limit}). Your limit will reset on ${formattedEndDate}.`,
      status: 429,
    };
  }

  return {}; // No errors, under limit
}

export async function checkDailyMessageLimit(
  supabase: SupabaseClient,
  user: User
): Promise<{ error?: string; status?: number }> {
  // Default to free plan
  return await checkDailyLimit(supabase, user, DEFAULT_LIMITS.free);
}
