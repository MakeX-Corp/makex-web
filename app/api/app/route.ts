import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/app – allocate a container to the authenticated user
// ────────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Authenticate
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  const { supabase, user } = result;
  console.log("called", user);

  // Grab one available container
  const { data: container, error: containerError } = await supabase
    .from("available_containers")
    .select("*")
    .limit(1)
    .single();

  if (containerError || !container) {
    return NextResponse.json(
      { error: "No available containers" },
      { status: 404 }
    );
  }

  // Delete it from the pool
  const { error: deleteError } = await supabase
    .from("available_containers")
    .delete()
    .match({ id: container.id });

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to allocate container" },
      { status: 500 }
    );
  }

  // Insert into user_apps
  const { data: userApp, error: createError } = await supabase
    .from("user_apps")
    .insert({
      user_id: user.id,
      app_name: container.app_name,
      app_url: container.app_url,
    })
    .select()
    .single();

  if (createError) {
    // Ideally rollback the previous delete (requires a Postgres function or RPC)
    return NextResponse.json(
      { error: "Failed to create user app" },
      { status: 500 }
    );
  }

  return NextResponse.json(userApp);
}

// GET /api/app - Get all apps for the authenticated user
export async function GET(request: Request) {
  try {
    console.log("GET request received");
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;

    const { supabase, user } = result;

    // Check if an ID is provided to get a specific app
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("id");

    // If ID is provided, get a specific app
    if (appId) {
      const { data: app, error } = await supabase
        .from("user_apps")
        .select("*")
        .eq("id", appId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned error code
          return NextResponse.json({ error: "App not found" }, { status: 404 });
        }
        return NextResponse.json(
          { error: "Failed to fetch app" },
          { status: 500 }
        );
      }

      return NextResponse.json(app);
    }

    // Otherwise get all apps for the user
    const { data: apps, error } = await supabase
      .from("user_apps")
      .select("*")
      .eq("user_id", user.id);

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

    // Delete from Fly.io first
    try {
      const flyToken = process.env.FLY_API_TOKEN;
      const appName = app.app_name;

      // First, list all machines for the app
      const machinesResponse = await fetch(
        `https://api.machines.dev/v1/apps/${appName}/machines`,
        {
          headers: {
            Authorization: `Bearer ${flyToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!machinesResponse.ok) {
        throw new Error(
          `Failed to list machines: ${machinesResponse.statusText}`
        );
      }

      const machines = await machinesResponse.json();

      // Delete each machine with force=true
      for (const machine of machines) {
        const machineDeleteResponse = await fetch(
          `https://api.machines.dev/v1/apps/${appName}/machines/${machine.id}?force=true`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${flyToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!machineDeleteResponse.ok) {
          throw new Error(
            `Failed to delete machine ${machine.id}: ${machineDeleteResponse.statusText}`
          );
        }
      }

      // After all machines are deleted, delete the app
      const deleteResponse = await fetch(
        `https://api.machines.dev/v1/apps/${appName}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${flyToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to delete app from Fly.io: ${deleteResponse.statusText}`
        );
      }
    } catch (flyError) {
      console.error("Error deleting from Fly.io:", flyError);
      return NextResponse.json(
        { error: "Failed to delete app from Fly.io" },
        { status: 500 }
      );
    }

    // If Fly.io deletion was successful, delete from Supabase
    const { error: deleteError } = await supabase
      .from("user_apps")
      .delete()
      .eq("id", appId)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
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
