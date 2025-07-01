import { NextResponse } from "next/server";
import { aiAgent } from "@/trigger/ai-agent";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { generateAppName } from "@/utils/server/app-name-generator";
import { createE2BContainer } from "@/utils/server/e2b";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { startExpo } from "@/trigger/start-expo";
import { NextRequest } from "next/server";
export async function POST(request: NextRequest) {
  try {
    const userResult = await getSupabaseWithUser(request);
    if (userResult instanceof NextResponse) return userResult;
    if ("error" in userResult) return userResult.error;
    const { supabase, user } = userResult;

    const body = await request.json();
    const { appId, userPrompt, isNewApp, images } = body;

    if (!userPrompt) {
      return NextResponse.json(
        { error: "Missing required field: userPrompt" },
        { status: 400 }
      );
    }

    let finalAppId = appId;
    let appName: string = "";
    let sessionId: string | undefined;
    let apiHost: string = "";
    let appUrl: string = "";

    const adminSupabase = await getSupabaseAdmin();

    if (isNewApp) {
      // === CREATE APP FLOW ===
      appName = generateAppName();

      const { data: insertedApp, error: insertError } = await supabase
        .from("user_apps")
        .insert({
          user_id: user.id,
          app_name: appName,
          app_url: `https://${appName}.makex.app`,
        })
        .select()
        .single();

      if (insertError) throw new Error("Failed to insert app");

      finalAppId = insertedApp.id;
      appUrl = insertedApp.app_url;

      const { data: newSandbox, error: sandboxError } = await adminSupabase
        .from("user_sandboxes")
        .insert({
          user_id: user.id,
          app_id: finalAppId,
          sandbox_status: "starting",
          sandbox_created_at: new Date().toISOString(),
          sandbox_updated_at: new Date().toISOString(),
          sandbox_provider: "e2b",
          app_status: "starting",
        })
        .select()
        .limit(1);

      if (sandboxError) throw new Error("Failed to insert sandbox");

      const sandboxId = newSandbox?.[0]?.id;
      if (!sandboxId) throw new Error("Missing sandbox ID");

      const container = await createE2BContainer({
        userId: user.id,
        appId: finalAppId,
        appName,
      });

      await redisUrlSetter(appName, container.appHost, container.apiHost);

      const { error: updateError } = await adminSupabase
        .from("user_sandboxes")
        .update({
          sandbox_status: "active",
          sandbox_id: container.containerId,
          api_url: container.apiHost,
        })
        .eq("id", sandboxId);

      if (updateError) throw new Error("Failed to update sandbox");

      const { error: updateAppError } = await supabase
        .from("user_apps")
        .update({
          api_url: container.apiHost,
        })
        .eq("id", finalAppId);

      if (updateAppError) throw new Error("Failed to update app");

      const { data: session, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          app_id: finalAppId,
          user_id: user.id,
          title: "New Chat",
          metadata: { initialPrompt: userPrompt },
        })
        .select()
        .single();

      if (sessionError) throw new Error("Failed to create session");

      sessionId = session.id;
      apiHost = container.apiHost;

      await startExpo.trigger({
        appId: finalAppId,
        appName,
        sandboxId,
        containerId: container.containerId,
        initial: true,
      });

      // Immediately mark app status changing for AI
      await adminSupabase
        .from("user_sandboxes")
        .update({ app_status: "changing" })
        .eq("app_id", finalAppId);
    } else {
      // === EDIT EXISTING APP FLOW ===
      if (!finalAppId) {
        return NextResponse.json(
          { error: "Missing appId for existing app update" },
          { status: 400 }
        );
      }

      const { error } = await adminSupabase
        .from("user_sandboxes")
        .update({ app_status: "changing" })
        .eq("app_id", finalAppId);

      if (error) throw new Error("Failed to update sandbox status");
    }

    // === Trigger AI agent ===
    const result = await aiAgent.trigger({
      appId: finalAppId,
      userPrompt,
      images,
    });

    return NextResponse.json({
      success: true,
      appId: finalAppId,
      sessionId,
      appName,
      appUrl,
      apiUrl: apiHost,
    });
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
