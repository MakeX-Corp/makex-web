import { NextResponse, NextRequest } from "next/server";
import { aiAgent } from "@/trigger/ai-agent";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import {
  generateAppName,
  generateDisplayName,
} from "@/utils/server/app-name-generator";
import { createE2BContainer } from "@/utils/server/e2b";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { checkSubscription } from "@/utils/server/subscription-manager";
import { setupContainer } from "@/trigger/setup-container";

export async function POST(request: NextRequest) {
  try {
    const userResult = await getSupabaseWithUser(request);
    if (userResult instanceof NextResponse) return userResult;
    if ("error" in userResult) return userResult.error;
    const { supabase, user } = userResult;

    const body = await request.json();
    const {
      appId,
      userPrompt,
      isNewApp,
      images,
      model,
      sessionId: providedSessionId,
    } = body;

    if (!userPrompt) {
      return NextResponse.json(
        { error: "Missing required field: userPrompt" },
        { status: 400 },
      );
    }

    // Use default model if none provided, same as chat endpoint
    const modelName = model || "claude-4-sonnet-latest";

    const canSend = await checkSubscription(user.id);
    if (!canSend) {
      return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 429 });
    }

    let finalAppId = appId;
    let appName = "";
    let currentSessionId: string | undefined;
    let apiHost = "";
    let appUrl = "";
    let displayName = "";
    const admin = await getSupabaseAdmin();
    if (isNewApp) {
      appName = generateAppName();
      displayName = await generateDisplayName(userPrompt, appName);

      const { data: insertedApp, error: insertError } = await supabase
        .from("user_apps")
        .insert({
          user_id: user.id,
          app_name: appName,
          display_name: displayName,
          app_url: `https://${appName}.makex.app`,
        })
        .select()
        .single();

      if (insertError) throw new Error("Failed to insert app");

      finalAppId = insertedApp.id;
      appUrl = insertedApp.app_url;

      const { data: newSandbox, error: sandboxError } = await admin
        .from("user_sandboxes")
        .insert({
          user_id: user.id,
          app_id: finalAppId,
          sandbox_status: "starting",
          sandbox_created_at: new Date().toISOString(),
          sandbox_updated_at: new Date().toISOString(),
          sandbox_provider: "e2b",
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

      await redisUrlSetter(appName, container.appHost);

      const { error: updateError } = await admin
        .from("user_sandboxes")
        .update({
          sandbox_status: "active",
          sandbox_id: container.containerId,
        })
        .eq("id", sandboxId);

      if (updateError) throw new Error("Failed to update sandbox");

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

      currentSessionId = session.id;
      apiHost = container.apiHost;

      await setupContainer.trigger({
        appId: finalAppId,
        appName,
        sandboxId,
        containerId: container.containerId,
      });

      await admin
        .from("user_apps")
        .update({ coding_status: "changing" })
        .eq("id", finalAppId);
    } else {
      if (!finalAppId) {
        return NextResponse.json(
          { error: "Missing appId for existing app update" },
          { status: 400 },
        );
      }
    }

    await aiAgent.trigger({
      appId: finalAppId,
      userPrompt,
      images,
      model: modelName,
      sessionId: providedSessionId || currentSessionId,
    });

    return NextResponse.json({
      success: true,
      appId: finalAppId,
      sessionId: currentSessionId,
      appName,
      appUrl,
    });
  } catch (error) {
    console.error("[Mobile API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
