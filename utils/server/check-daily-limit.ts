import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";

// Default message limits if environment variables are not set
const DEFAULT_LIMITS = {
  free: 1,
  starter: 100,
  pro: 200,
};

// Get message limit based on subscription
export async function getMessageLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
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
    // Default to free plan limit if there's an error
    return parseInt(
      process.env.NEXT_PUBLIC_MAX_DAILY_MESSAGES_FREE ||
        DEFAULT_LIMITS.free.toString(),
      10
    );
  }
  if (!subscription) {
    // Free plan
    return parseInt(
      process.env.NEXT_PUBLIC_MAX_DAILY_MESSAGES_FREE ||
        DEFAULT_LIMITS.free.toString(),
      10
    );
  }

  // Determine the message limit based on the subscription
  switch (subscription.price_id) {
    case process.env.NEXT_PUBLIC_PADDLE_STARTER_ID:
      return parseInt(
        process.env.NEXT_PUBLIC_MAX_DAILY_MESSAGES_STARTER ||
          DEFAULT_LIMITS.starter.toString(),
        10
      );
    case process.env.NEXT_PUBLIC_PADDLE_PRO_ID:
      return parseInt(
        process.env.NEXT_PUBLIC_MAX_DAILY_MESSAGES_PRO ||
          DEFAULT_LIMITS.pro.toString(),
        10
      );
    default:
      // Default to free plan limit
      return parseInt(
        process.env.NEXT_PUBLIC_MAX_DAILY_MESSAGES_FREE ||
          DEFAULT_LIMITS.free.toString(),
        10
      );
  }
}

export async function getDailyMessageCount(
  supabase: SupabaseClient,
  user: User
): Promise<{ count: number | null; error: any }> {
  // Get user's local midnight time
  const now = new Date();
  const userMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const nextMidnight = new Date(userMidnight.getTime() + 24 * 60 * 60 * 1000);
  const { count, error } = await supabase
    .from("app_chat_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", userMidnight.toISOString())
    .lt("created_at", nextMidnight.toISOString());

  console.log("count", count);
  return { count, error };
}

export async function checkDailyMessageLimit(
  supabase: SupabaseClient,
  user: User
): Promise<{ error?: string; status?: number }> {
  const { count, error: countError } = await getDailyMessageCount(
    supabase,
    user
  );

  if (countError) {
    return {
      error: "Failed to check message limit",
      status: 500,
    };
  }

  const maxDailyMessages = await getMessageLimit(supabase, user.id);

  if (count && count >= maxDailyMessages) {
    return {
      error: `Daily message limit reached (${count}/${maxDailyMessages}). Please try again tomorrow or upgrade your plan.`,
      status: 429,
    };
  }

  return {};
}
