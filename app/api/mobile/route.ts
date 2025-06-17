import { NextResponse } from "next/server";
import { aiAgent } from "@/trigger/ai-agent";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userResult = await getSupabaseWithUser(request);
    if (userResult instanceof NextResponse) return userResult;
    if ("error" in userResult) return userResult.error;

    const body = await request.json();
    const { appId, userPrompt } = body;

    if (!appId || !userPrompt) {
      return NextResponse.json(
        { error: "Missing required fields: appId and userPrompt" },
        { status: 400 }
      );
    }
    const supabase = await getSupabaseAdmin();
    // Update sandbox status to changing
    const { error: updateError } = await supabase
      .from("user_sandboxes")
      .update({ app_status: "changing" })
      .eq("app_id", appId);

    if (updateError) {
      throw new Error("Failed to update sandbox status");
    }

    // Trigger the AI agent task
    const result = await aiAgent.trigger({
      appId,
      userPrompt,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Mobile API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const result = await getSupabaseWithUser(request as NextRequest);

  if (result instanceof NextResponse || "error" in result) {
    return result;
  }

  const { supabase, user } = result;

  try {
    // Fetch subscription record
    const { data: subscription, error } = await supabase
      .from("mobile_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !subscription) {
      console.log("error", error);
      console.log("No subscription found for user", user.id);
      return NextResponse.json({
        hasActiveSubscription: false,
        messagesSent: 0, // Default fallback
      });
    }

    // Determine subscription active status
    const now = new Date();
    const subscriptionEnd = subscription.subscription_end
      ? new Date(subscription.subscription_end)
      : null;
    const isActive =
      subscription.subscription_status === "active" &&
      subscriptionEnd !== null &&
      subscriptionEnd > now;

    return NextResponse.json({
      hasActiveSubscription: isActive,
      messagesSent: subscription.messages_used_this_period ?? 0,
    });
  } catch (err) {
    console.error("Failed to fetch subscription:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const result = await getSupabaseWithUser(request as NextRequest);

  if (result instanceof NextResponse || "error" in result) {
    return result;
  }

  const { user } = result;

  try {
    const body = await request.json();
    const { messagesDelta } = body;

    if (typeof messagesDelta !== "number" || messagesDelta < 0) {
      return NextResponse.json({ error: "Invalid delta" }, { status: 400 });
    }

    const admin = await getSupabaseAdmin();

    const { data, error: fetchError } = await admin
      .from("mobile_subscriptions")
      .select("messages_used_this_period")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !data) {
      console.error("No subscription row found:", fetchError);
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    const currentCount = data.messages_used_this_period ?? 0;
    const newCount = currentCount + messagesDelta;

    const { error: updateError } = await admin
      .from("mobile_subscriptions")
      .update({ messages_used_this_period: newCount })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update message count:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH handler error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
