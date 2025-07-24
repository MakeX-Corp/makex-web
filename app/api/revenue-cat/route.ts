import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
export async function POST(request: Request) {
  const secret = request.headers.get("authorization");
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;

  if (secret !== expected) {
    console.warn("❌ Unauthorized webhook attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  console.log("📬 RevenueCat webhook received");

  try {
    const body = await request.json();
    console.log("📦 Raw payload:", JSON.stringify(body, null, 2));

    const event = body.event;
    if (!event) {
      console.error("❌ Missing event field in payload");
      return NextResponse.json({ error: "Bad payload" }, { status: 400 });
    }

    const {
      type: eventType,
      transaction_id,
      app_user_id,
      original_app_user_id,
      purchased_at_ms,
      expiration_at_ms,
      product_id,
    } = event;

    const userId = app_user_id || original_app_user_id;
    const purchaseDate = new Date(Number(purchased_at_ms));
    const expirationDate = new Date(Number(expiration_at_ms));
    const now = new Date();
    const isExpiredEvent = eventType === "EXPIRATION";
    console.log("isExpiredEvent", isExpiredEvent);
    const isBillingExpired =
      eventType === "BILLING_ISSUE" && expirationDate < now;
    console.log("isBillingExpired", isBillingExpired);
    const status = isExpiredEvent || isBillingExpired ? "expired" : "active";
    console.log("status", status);

    console.log("🔍 Parsed:", {
      eventType,
      userId,
      transaction_id,
      purchaseDate,
      expirationDate,
      status,
      product_id,
    });

    if (!userId || !transaction_id || !purchaseDate || !expirationDate) {
      console.error("❌ Missing critical fields");
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = await getSupabaseAdmin();
    const { data: existing, error: fetchError } = await admin
      .from("mobile_subscriptions")
      .select(
        "last_transaction_id, subscription_end, subscription_status, messages_used_this_period",
      )
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("❌ DB fetch error", fetchError);
      return NextResponse.json({ error: "DB Read Error" }, { status: 500 });
    }

    const existingTx = existing?.last_transaction_id;
    console.log("existingTx", existingTx);
    const existingEnd = existing?.subscription_end
      ? new Date(existing.subscription_end)
      : null;
    const existingStatus = existing?.subscription_status;

    const isSameTx = transaction_id === existingTx;
    const isSameStatus = existingStatus === status;
    const isSameEnd =
      existingEnd && expirationDate.getTime() === existingEnd.getTime();

    const isDuplicate = isSameTx && isSameStatus && isSameEnd;
    const isStale = existingEnd && expirationDate < existingEnd;

    console.log("isSameTx", isSameTx);
    console.log("isSameStatus", isSameStatus);
    console.log("isSameEnd", isSameEnd);
    console.log("existingEnd", existingEnd);
    console.log("expirationDate", expirationDate);
    console.log("existingEnd", existingEnd);
    console.log("isDuplicate", isDuplicate);
    console.log("isStale", isStale);
    if (isDuplicate || isStale) {
      console.log("⏭️ Skipping event — duplicate or outdated", {
        isDuplicate,
        isStale,
        existingTx,
        transaction_id,
        existingEnd,
        expirationDate,
      });
      return NextResponse.json({ skipped: true });
    }

    console.log("event.product_id", event.product_id);
    const isNewBillingCycle = !existingEnd || expirationDate > existingEnd;
    console.log("isNewBillingCycle", isNewBillingCycle);
    const newMessageCount = isNewBillingCycle
      ? 0
      : existing?.messages_used_this_period || 0;

    console.log("newMessageCount", newMessageCount);
    const { error: upsertError } = await admin
      .from("mobile_subscriptions")
      .upsert(
        {
          user_id: userId,
          subscription_type: product_id,
          subscription_status: status,
          subscription_start: purchaseDate.toISOString(),
          subscription_end: expirationDate.toISOString(),
          last_transaction_id: transaction_id,
          messages_used_this_period: newMessageCount,
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      console.error("❌ Failed to update subscription", upsertError);
      return NextResponse.json({ error: "DB Write Error" }, { status: 500 });
    }

    console.log("✅ Subscription updated successfully");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Unexpected error", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
