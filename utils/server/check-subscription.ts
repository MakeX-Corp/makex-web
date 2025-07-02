import { getSupabaseAdmin } from "./supabase-admin";

export async function checkSubscription(userId: string) {
  const admin = await getSupabaseAdmin();

  let { data: subscription, error } = await admin
    .from("mobile_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !subscription) {
    await admin.from("mobile_subscriptions").insert({
      user_id: userId,
      subscription_type: "free",
      subscription_status: "inactive",
      messages_used_this_period: 0,
    });

    const { data } = await admin
      .from("mobile_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    subscription = data;
  }

  const now = new Date();
  const type = subscription.subscription_type;
  const used = subscription.messages_used_this_period ?? 0;

  const start = subscription.subscription_start
    ? new Date(subscription.subscription_start)
    : null;
  const end = subscription.subscription_end
    ? new Date(subscription.subscription_end)
    : null;

  const isActive =
    subscription.subscription_status === "active" &&
    start &&
    end &&
    now >= start &&
    now <= end;

  const freeLimit = Number(process.env.NEXT_PUBLIC_FREE_PLAN_LIMIT) || 20;
  const starterLimit =
    Number(process.env.NEXT_PUBLIC_STARTER_PLAN_LIMIT) || 250;

  let limit = 0;
  let canSend = false;

  if (type === "free") {
    limit = freeLimit;
    canSend = used < limit;
  } else if (type === "starter" && isActive) {
    limit = starterLimit;
    canSend = used < limit;
  }

  if (!canSend) return false;

  const { error: updateError } = await admin
    .from("mobile_subscriptions")
    .update({ messages_used_this_period: used + 1 })
    .eq("user_id", userId);

  if (updateError) throw new Error("Failed to increment message count");

  return true;
}
