import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { Sandbox } from '@e2b/code-interpreter'
import { generateAppName } from "@/utils/server/app-name-generator";
import { createClient } from 'redis';
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/app – allocate a container to the authenticated user
// ────────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Authenticate
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  const { supabase, user } = result;
  

  const sbx = await Sandbox.create('px2b0gc7d6r1svvz8g5t', { timeoutMs: 600_000 })
  const apiHost = sbx.getHost(8001)
  await sbx.commands.run(`cd /app/expo-app && export EXPO_PACKAGER_PROXY_URL=https://${apiHost} && yarn expo start --port 8000`, { background: true })
  const expoHost = sbx.getHost(8000)
  const appName = generateAppName()

  // Connect to Redis
  const redis = createClient({
    url: process.env.REDIS_URL,
  });
  
  await redis.connect();
  
  try {
    // Store mappings in Redis
    await redis.set(`proxy:${appName}.makex.app`, `https://${expoHost}`);
    await redis.set(`proxy:api-${appName}.makex.app`, `https://${apiHost}`);
    
    await redis.disconnect();
  } catch (error) {
    console.error('Redis error:', error);
  }

  let checkpointResponse = null;
  try {
    const fileBackendClient = createFileBackendApiClient(`https://api-${appName}.makex.app`);
    checkpointResponse = await fileBackendClient.post("/checkpoint/save", {
      name: "initial-checkpoint",
      message: "Initial checkpoint",
    });
  } catch (error) {
    console.error("Failed to save checkpoint:", error);
    return NextResponse.json({ error: "Failed to save checkpoint" }, { status: 500 });
  }

  // Insert into Supabase user_apps table
  const { data: insertedApp, error: insertError } = await supabase
    .from("user_apps")
    .insert({
      user_id: user.id,
      app_name: appName,
      app_url: `https://${appName}.makex.app`,
      api_url: `https://api-${appName}.makex.app`,
      sandbox_id: sbx.sandboxId, 
      sandbox_status: 'active',
      initial_commit: checkpointResponse.commit || checkpointResponse.current_commit,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Supabase insert error:', insertError);
    return NextResponse.json({ error: "Failed to save app data" }, { status: 500 });
  }

  return NextResponse.json(insertedApp);
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
    const sbxkill = await Sandbox.kill(app.sandbox_id) 
    
    const { error: updateError } = await supabase
      .from("user_apps")
      .update({ status: "deleted", sandbox_status: 'deleted' })
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
