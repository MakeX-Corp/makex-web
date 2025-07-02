import { getSupabaseAdmin } from "./supabase-admin";

export async function checkSubscription(userId: string) {
  const admin = await getSupabaseAdmin();

  let { data: subscription, error } = await admin
    .from("mobile_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  const now = new Date();

  // Create free sub if none
  if (error || !subscription) {
    const start = now;
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    await admin.from("mobile_subscriptions").insert({
      user_id: userId,
      subscription_type: "free",
      subscription_status: "inactive",
      subscription_start: start.toISOString(),
      subscription_end: end.toISOString(),
      messages_used_this_period: 0,
    });

    const { data } = await admin
      .from("mobile_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    subscription = data;
  }

  const type = subscription.subscription_type;
  const used = subscription.messages_used_this_period ?? 0;
  const start = subscription.subscription_start
    ? new Date(subscription.subscription_start)
    : null;
  const end = subscription.subscription_end
    ? new Date(subscription.subscription_end)
    : null;

  let updatedUsed = used;

  const isFree = type === "free";
  const isActive =
    subscription.subscription_status === "active" &&
    start &&
    end &&
    now >= start &&
    now <= end;

  //  If expired, "renew" the free period
  if (isFree && end && now > end) {
    const newStart = now;
    const newEnd = new Date(now);
    newEnd.setMonth(newEnd.getMonth() + 1);

    const { error: resetError } = await admin
      .from("mobile_subscriptions")
      .update({
        subscription_start: newStart.toISOString(),
        subscription_end: newEnd.toISOString(),
        messages_used_this_period: 0,
        subscription_status: "inactive",
      })
      .eq("user_id", userId);

    if (resetError) throw new Error("Failed to renew free plan");

    updatedUsed = 0;
  }

  const freeLimit = Number(process.env.NEXT_PUBLIC_FREE_PLAN_LIMIT) || 20;
  const starterLimit =
    Number(process.env.NEXT_PUBLIC_STARTER_PLAN_LIMIT) || 250;

  let limit = 0;
  let canSend = false;

  if (isFree) {
    limit = freeLimit;
    canSend = updatedUsed < limit;
  } else if (type === "makex_starter_plan" && isActive) {
    limit = starterLimit;
    canSend = updatedUsed < limit;
  }

  if (!canSend) return false;

  const { error: updateError } = await admin
    .from("mobile_subscriptions")
    .update({ messages_used_this_period: updatedUsed + 1 })
    .eq("user_id", userId);

  if (updateError) throw new Error("Failed to increment message count");

  return true;
}
