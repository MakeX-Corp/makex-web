import { getSupabaseAdmin } from "./supabase-admin";
import { checkMessageLimit } from "./subscription-helpers";

export async function checkSubscription(userId: string) {
  try {
    // Check message limits using the unified system
    const limitResult = await checkMessageLimit(userId);

    return !limitResult.reachedLimit;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}
