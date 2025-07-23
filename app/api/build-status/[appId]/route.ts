import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

// Add this enhanced logging to your build status API route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;
    const { supabase, user } = result;

    const { appId } = await params;

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    // Query the user_sandboxes table for the current status
    const { data: sandbox, error } = await supabase
      .from("user_sandboxes")
      .select(
        "sandbox_status, app_status, api_url, sandbox_updated_at, expo_status"
      )
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Supabase query error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "App not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch app status" },
        { status: 500 }
      );
    }

    // Simple status mapping based on both sandbox_status and app_status
    let status = "in_progress";
    let message = "Building your app...";

    // 🔍 Check both conditions explicitly
    const sandboxIsActive = sandbox.sandbox_status === "active";
    const appIsActive = sandbox.app_status === "active";
    const expoIsActive = sandbox.expo_status === "bundled";

    if (sandboxIsActive && appIsActive && expoIsActive) {
      status = "complete";
      message = "Your app is ready!";
    } else if (
      sandbox.sandbox_status === "error" ||
      sandbox.app_status === "error"
    ) {
      status = "failed";
      message = "Build failed";
    } else if (sandbox.app_status === "changing") {
      status = "in_progress";
      message = "Changing app...";
    } else if (sandbox.sandbox_status === "starting") {
      status = "in_progress";
      message = "Starting app...";
    } else if (sandbox.sandbox_status === "paused") {
      status = "in_progress";
      message = "Resuming app...";
    }

    const response = {
      status,
      message,
      sandbox_status: sandbox.sandbox_status,
      app_status: sandbox.app_status,
      updated_at: sandbox.sandbox_updated_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Build status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
