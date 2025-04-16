import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";

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
  user: User,
  maxDailyMessages: number
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

  if (count && count >= maxDailyMessages) {
    return {
      error: "Daily message limit reached. Please try again tomorrow.",
      status: 429,
    };
  }

  return {};
}
