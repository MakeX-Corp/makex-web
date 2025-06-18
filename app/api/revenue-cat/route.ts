import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function POST(request: Request) {
  const secret = request.headers.get("authorization");
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  console.log("RevenueCat webhook received");

  try {
    const body = await request.json();

    // Support both test and real events
    const event = body.event || body;
    const eventType = event.type;

    const userId = event.app_user_id || event.original_app_user_id;
    console.log("userId", userId);
    const purchaseMs = event.purchased_at_ms;
    const expirationMs = event.expiration_at_ms;

    if (!userId || !purchaseMs || !expirationMs) {
      console.error("Invalid payload", body);
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const purchaseDate = new Date(Number(purchaseMs));
    const expirationDate = new Date(Number(expirationMs));

    const status = eventType === "EXPIRATION" ? "expired" : "active";

    const admin = await getSupabaseAdmin();

    // First, check if user already exists
    const { data: existing, error: fetchError } = await admin
      .from("mobile_subscriptions")
      .select("messages_used_this_period")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Fetch error:", fetchError);
      return NextResponse.json({ error: "DB Read Error" }, { status: 500 });
    }

    const isNew = !existing;
    console.log("isNew", isNew);
    const { error: upsertError } = await admin
      .from("mobile_subscriptions")
      .upsert(
        {
          user_id: userId,
          subscription_type: "starter",
          subscription_status: status,
          subscription_start: purchaseDate.toISOString(),
          subscription_end: expirationDate.toISOString(),
          messages_used_this_period: isNew
            ? 0
            : existing.messages_used_this_period,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Failed to update subscription", upsertError);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
