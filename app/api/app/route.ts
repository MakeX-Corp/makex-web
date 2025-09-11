import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { generateAppName } from "@/utils/server/app-name-generator";
import { deleteContainer } from "@/trigger/delete-container";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { createE2BContainer } from "@/utils/server/e2b";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { deleteConvex } from "@/trigger/delete-convex";
import { generateDisplayName } from "@/utils/server/app-name-generator";
import { setupContainer } from "@/trigger/setup-container";

export const maxDuration = 300;

export async function POST(request: Request) {
  const timings: Record<string, number> = {};
  const startTime = performance.now();

  const result = await getSupabaseWithUser(request as NextRequest);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;
  const { supabase, user } = result;

  try {
    const body = await request.json();
    const { prompt } = body;

    const appName = generateAppName();
    const displayName = await generateDisplayName(prompt, appName);

    timings.authAndSetup = performance.now() - startTime;

    const appStartTime = performance.now();
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
    timings.appCreation = performance.now() - appStartTime;

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save app data" },
        { status: 500 },
      );
    }

    const adminSupabase = await getSupabaseAdmin();

    const { data: newSandbox, error: newSandboxError } = await adminSupabase
      .from("user_sandboxes")
      .insert({
        user_id: user.id,
        app_id: insertedApp.id,
        sandbox_status: "starting",
        sandbox_created_at: new Date().toISOString(),
        sandbox_updated_at: new Date().toISOString(),
        sandbox_provider: "e2b",
      })
      .select()
      .limit(1);

    if (newSandboxError) {
      throw new Error(
        `Failed inserting new sandbox: ${newSandboxError.message}`,
      );
    }

    const sandboxDbId = newSandbox?.[0]?.id;
    if (!sandboxDbId) {
      throw new Error("Failed to create initial sandbox record (missing ID)");
    }

    const containerStartTime = performance.now();

    const { appHost, apiHost, containerId } = await createE2BContainer({
      userId: user.id,
      appId: insertedApp.id,
      appName: appName,
    });

    timings.containerInitiation = performance.now() - containerStartTime;

    const maxRetries = 10;
    const retryDelay = 2000;
    let response;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        response = await fetch(apiHost);
        if (response.status !== 502) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryCount++;
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryCount++;
      }
    }

    if (retryCount === maxRetries) {
      console.log("Max retries reached, proceeding with container setup...");
    }

    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        sandbox_status: "active",
        sandbox_id: containerId,
      })
      .eq("id", sandboxDbId);

    if (updateError) {
      throw new Error(
        `Failed updating sandbox with container info: ${updateError.message}`,
      );
    }

    const { error: appUpdateError } = await adminSupabase
      .from("user_apps")
      .update({
        current_sandbox_id: sandboxDbId,
      })
      .eq("id", insertedApp.id);

    if (appUpdateError) {
      throw new Error(
        `Failed updating app with current sandbox info: ${appUpdateError.message}`,
      );
    }

    await redisUrlSetter(appName, appHost);

    const sessionStartTime = performance.now();
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        app_id: insertedApp.id,
        user_id: user.id,
        title: `New Chat`,
        metadata: { initialPrompt: prompt },
      })
      .select()
      .single();
    timings.sessionCreation = performance.now() - sessionStartTime;

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    timings.totalTime = performance.now() - startTime;

    await setupContainer.trigger(
      {
        appId: insertedApp.id,
        appName: appName,
        containerId: containerId,
        sandboxId: sandboxDbId,
      },
      {
        queue: "critical-container-setup",
      },
    );

    return NextResponse.json({
      ...insertedApp,
      sessionId: session.id,
      redirectUrl: `/dashboard/${insertedApp.id}?sessionId=${session.id}`,
    });
  } catch (error) {
    console.error("Error in app creation:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const result = await getSupabaseWithUser(request as NextRequest);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("id");

    if (appId) {
      const { data: app, error } = await supabase
        .from("user_apps")
        .select("*")
        .eq("id", appId)
        .eq("user_id", user?.id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch app", details: error.message },
          { status: error.code === "PGRST116" ? 404 : 500 },
        );
      }

      return NextResponse.json(app);
    } else {
      const { data: apps, error } = await supabase
        .from("user_apps")
        .select(
          `
        *,
        chat_sessions(id)
      `,
        )
        .eq("user_id", user?.id)
        .or("status.is.null")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch apps" },
          { status: 500 },
        );
      }

      const appsWithSessionId = apps?.map((app) => ({
        ...app,
        session_id: app.chat_sessions?.[0]?.id || "",
      }));
      return NextResponse.json(appsWithSessionId);
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await getSupabaseWithUser(request as NextRequest);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("id");

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 },
      );
    }

    const { data: app, error: fetchError } = await supabase
      .from("user_apps")
      .select("*")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const { error: listingDeleteError } = await supabase
      .from("app_listing_info")
      .delete()
      .eq("app_id", appId);

    if (listingDeleteError) {
      console.warn(
        "Warning: Could not delete app listing:",
        listingDeleteError.message,
      );
    }

    const { error: updateError } = await supabase
      .from("user_apps")
      .update({ status: "deleted" })
      .eq("id", appId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await deleteContainer.trigger({
      userId: user.id,
      appId: app.id,
      appName: app.app_name,
    });

    await deleteConvex.trigger({
      projectId: app.convex_project_id,
    });

    return NextResponse.json({ message: "App deleted successfully" });
  } catch (error) {
    console.error("Error deleting app:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the app" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await getSupabaseWithUser(request as NextRequest);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const body = await request.json();
    const { appId, displayName } = body;

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 },
      );
    }

    if (!displayName) {
      return NextResponse.json(
        { error: "display_name is required" },
        { status: 400 },
      );
    }

    const { data: app, error: fetchError } = await supabase
      .from("user_apps")
      .select("id")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !app) {
      return NextResponse.json(
        { error: "App not found or access denied" },
        { status: 404 },
      );
    }

    const { data: updatedApp, error: updateError } = await supabase
      .from("user_apps")
      .update({ display_name: displayName })
      .eq("id", appId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating app:", updateError);
      return NextResponse.json(
        { error: "Failed to update app" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "App updated successfully",
      app: updatedApp,
    });
  } catch (error) {
    console.error("Error in app update:", error);
    return NextResponse.json(
      { error: "Failed to process update request" },
      { status: 500 },
    );
  }
}
