import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { Sandbox } from "@e2b/code-interpreter";
import { generateAppName } from "@/utils/server/app-name-generator";
import { redisUrlSetter } from "@/utils/server/redis-client";

/*

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/app – allocate a container to the authenticated user
// ────────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Authenticate
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  const { supabase, user } = result;
  

  const appName = generateAppName()

  // Insert into Supabase user_apps table
  const { data: insertedApp, error: insertError } = await supabase
    .from("user_apps")
    .insert({
      user_id: user.id,
      app_name: appName,
      app_url: `https://${appName}.makex.app`,
      api_url: `https://api-${appName}.makex.app`,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Supabase insert error:', insertError);
    return NextResponse.json({ error: "Failed to save app data" }, { status: 500 });
  }

  return NextResponse.json(insertedApp);
}*/

export async function POST(request: Request) {
  // Authenticate
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  const { supabase, user } = result;

  try {
    // Get prompt from request body
    const body = await request.json();
    const { prompt } = body;

    const appName = generateAppName();

    // Begin transaction to ensure both app and session are created atomically
    // Insert into Supabase user_apps table
    /*
    const { data: insertedApp, error: insertError } = await supabase
      .from("user_apps")
      .insert({
        user_id: user.id,
        app_name: appName,
        app_url: `https://${appName}.makex.app`,
        api_url: `https://api-${appName}.makex.app`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save app data" },
        { status: 500 }
      );
    }

    // Create the session in the same transaction
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        app_id: insertedApp.id,
        user_id: user.id,
        title: `New Chat`, // Default title
        metadata: { initialPrompt: prompt }, // Store prompt in metadata
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }
    */
    const insertedApp = { id: "123" };
    const session = { id: "123" };
    // Return the app data along with session ID and redirect URL
    return NextResponse.json({
      ...insertedApp,
      sessionId: session.id,
      redirectUrl: `/workspace/${insertedApp.id}/${session.id}`,
    });
  } catch (error) {
    console.error("Error in app creation:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// GET /api/app - Get all apps for the authenticated user
export async function GET(request: Request) {
  try {
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;

    const { supabase, user } = result;

    const { data: apps, error } = await supabase
      .from("user_apps")
      .select("*")
      .eq("user_id", user.id)
      .or("status.is.null");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch apps" },
        { status: 500 }
      );
    }

    return NextResponse.json(apps);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/app - Delete specific app
export async function DELETE(request: Request) {
  try {
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;

    const { supabase, user } = result;

    // Get the app ID from the URL
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("id");

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    // Get the app details from Supabase first
    const { data: app, error: fetchError } = await supabase
      .from("user_apps")
      .select("*")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // kill the sandbox
    const sbxkill = await Sandbox.kill(app.sandbox_id);

    // redis set te app url and api url to homepage
    await redisUrlSetter(
      app.app_name,
      "https://makex.app/app-not-found",
      "https://makex.app/app-not-found"
    );

    const { error: updateError } = await supabase
      .from("user_apps")
      .update({ status: "deleted", sandbox_status: "deleted" })
      .eq("id", appId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "App deleted successfully" });
  } catch (error) {
    console.error("Error deleting app:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the app" },
      { status: 500 }
    );
  }
}
