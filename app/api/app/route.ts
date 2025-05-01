import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { generateAppName } from "@/utils/server/app-name-generator";
import { createContainer } from "@/trigger/create-container";
import { deleteContainer } from "@/trigger/delete-container";

export async function POST(request: Request) {
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

    // Trigger container creation and wait for completion
    await createContainer.trigger({
      userId: user.id,
      appId: insertedApp.id,
      appName,
    });

    //sleep for 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 15000));

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

    // Return the app data along with session ID and redirect URL
    return NextResponse.json({
      ...insertedApp,
      sessionId: session.id,
      redirectUrl: `/dashboard/${insertedApp.id}?sessionId=${session.id}`,
    });
  } catch (error) {
    console.error("Error in app creation:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// GET /api/app - Get all apps or a specific app by ID for the authenticated user
export async function GET(request: Request) {
  try {
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;

    const { supabase, user } = result;

    // Get the app ID from the URL if provided
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("id");

    // If an appId is provided, get just that specific app
    if (appId) {
      const { data: app, error } = await supabase
        .from("user_apps")
        .select("*")
        .eq("id", appId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch app", details: error.message },
          { status: error.code === "PGRST116" ? 404 : 500 }
        );
      }

      return NextResponse.json(app);
    }

    // Otherwise, get all apps for the user
    else {
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
    }
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

    return NextResponse.json({ message: "App deleted successfully" });
  } catch (error) {
    console.error("Error deleting app:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the app" },
      { status: 500 }
    );
  }
}

// PATCH /api/app - Update specific fields of an app
export async function PATCH(request: Request) {
  try {
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;

    const { supabase, user } = result;

    // Get the request body
    const body = await request.json();
    const { appId, displayName } = body;

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    if (!displayName) {
      return NextResponse.json(
        { error: "display_name is required" },
        { status: 400 }
      );
    }

    // Verify the app belongs to the user
    const { data: app, error: fetchError } = await supabase
      .from("user_apps")
      .select("id")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !app) {
      return NextResponse.json(
        { error: "App not found or access denied" },
        { status: 404 }
      );
    }

    // Update only the display_name field
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
        { status: 500 }
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
      { status: 500 }
    );
  }
}
