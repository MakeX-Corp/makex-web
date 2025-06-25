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
    const { appId, userPrompt, images } = body;

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
      images,
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
      console.log("No subscription found for user", user.id);

      // create a default "free" subscription record
      const admin = await getSupabaseAdmin();

      const { error: insertError } = await admin
        .from("mobile_subscriptions")
        .insert({
          user_id: user.id,
          subscription_type: "free",
          subscription_status: "inactive",
          messages_used_this_period: 0,
        });

      if (insertError) {
        console.error("Failed to create default subscription", insertError);
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        hasActiveSubscription: false,
        canSendMessage: true,
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

    //logic for determining if the user can send a message
    const subscriptionType = subscription.subscription_type;
    const messagesSent = subscription.messages_used_this_period ?? 0;

    const starterPlanLimit =
      Number(process.env.NEXT_PUBLIC_STARTER_PLAN_LIMIT) || 250;
    const freePlanLimit = Number(process.env.NEXT_PUBLIC_FREE_PLAN_LIMIT) || 20;
    let canSendMessage = false;
    if (subscriptionType === "starter") {
      canSendMessage = messagesSent < starterPlanLimit;
    } else if (subscriptionType === "free") {
      //if no plan
      canSendMessage = messagesSent < freePlanLimit;
    } else {
      canSendMessage = false;
    }

    return NextResponse.json({
      hasActiveSubscription: isActive,
      canSendMessage: canSendMessage,
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
