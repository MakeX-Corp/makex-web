import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

// Verify webhook signature manually
function verifyPaddleSignature(payload: string, signature: string): boolean {
  try {
    const publicKey = process.env.PADDLE_PUBLIC_KEY;
    if (!publicKey) {
      console.error("Missing Paddle public key");
      return false;
    }

    const verifier = crypto.createVerify("sha1WithRSAEncryption");
    verifier.update(payload);
    return verifier.verify(publicKey, Buffer.from(signature, "base64"));
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Get Paddle signature from headers
    const signature = req.headers.get("paddle-signature") || "";

    // Get raw request body for verification
    const rawBody = await req.text();

    // Parse the JSON payload
    const payload = JSON.parse(rawBody);
    const event = payload.data;
    const eventType = payload.event_type;

    console.log("Received webhook:", eventType);

    // Verify signature if in production
    // Uncomment the block below when ready for production
    /*
    if (!verifyPaddleSignature(rawBody, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    */

    // Get Supabase client
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    // Process different event types
    switch (eventType) {
      case "subscription.created":
        await handleSubscriptionCreated(event, supabase);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(event, supabase);
        break;
      case "subscription.canceled":
        await handleSubscriptionCanceled(event, supabase);
        break;
      case "transaction.completed":
        await handleTransactionCompleted(event, supabase);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(event: any, supabase: any) {
  // Extract userId from custom data
  let userId = event.custom_data?.userId;
  if (!userId) {
    console.error("No userId found in subscription data");
    return;
  }
  try {
    // Insert subscription record
    const { error } = await supabase.from("subscriptions").insert({
      id: event.id,
      user_id: userId,
      status: event.status,
      price_id: event.items[0].price.id,
      quantity: event.items[0].quantity || 1,
      cancel_at_period_end: event.cancel_at_period_end || false,
      canceled_at: event.canceled_at,
      current_period_start: event.current_billing_period.starts_at,
      current_period_end: event.current_billing_period.ends_at,
      created_at: event.created_at,
      customer_id: event.customer_id,
    });

    if (error) throw error;
    console.log(`Subscription ${event.id} created successfully`);
  } catch (error) {
    console.error("Error creating subscription:", error);
  }
}

async function handleSubscriptionUpdated(event: any, supabase: any) {
  try {
    // Update subscription record
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: event.status,
        price_id: event.price?.id,
        quantity: event.quantity || 1,
        cancel_at_period_end: event.cancel_at_period_end || false,
        canceled_at: event.canceled_at,
        current_period_start: event.current_period_start,
        current_period_end: event.current_period_end,
      })
      .eq("id", event.id);

    if (error) throw error;
    console.log(`Subscription ${event.id} updated successfully`);
  } catch (error) {
    console.error("Error updating subscription:", error);
  }
}

async function handleSubscriptionCanceled(event: any, supabase: any) {
  try {
    // Update subscription to canceled status
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: event.canceled_at || new Date().toISOString(),
        cancel_at_period_end: true,
      })
      .eq("id", event.id);

    if (error) throw error;
    console.log(`Subscription ${event.id} canceled successfully`);
  } catch (error) {
    console.error("Error canceling subscription:", error);
  }
}

async function handleTransactionCompleted(event: any, supabase: any) {
  try {
    // Get user ID from transaction data or related subscription
    let userId = event.customer?.user_id || event.passthrough?.userId;

    // If userId is not directly available, try to get it from the subscription
    if (!userId && event.subscription_id) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("id", event.subscription_id)
        .single();

      if (subscription) {
        userId = subscription.user_id;
      }
    }

    if (!userId) {
      console.error("No userId found for transaction");
      return;
    }

    // Insert transaction record
    const { error } = await supabase.from("transactions").insert({
      id: event.id,
      user_id: userId,
      subscription_id: event.subscription_id,
      price_id: event.price?.id,
      status: event.status,
      payment_method: event.payment_method,
      amount: event.total,
      currency: event.currency_code,
      created_at: event.created_at,
    });

    if (error) throw error;
    console.log(`Transaction ${event.id} recorded successfully`);
  } catch (error) {
    console.error("Error creating transaction:", error);
  }
}
