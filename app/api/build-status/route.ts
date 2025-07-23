import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function POST(request: NextRequest) {
  try {
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const body = await request.json();
    const { appIds } = body;

    if (!Array.isArray(appIds) || appIds.length === 0) {
      return NextResponse.json(
        { error: "appIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch all matching sandboxes in one query
    const { data: sandboxes, error } = await supabase
      .from("user_sandboxes")
      .select(
        "app_id, sandbox_status, app_status, api_url, sandbox_updated_at, expo_status"
      )
      .in("app_id", appIds)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase batch query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch app statuses" },
        { status: 500 }
      );
    }

    // Map results by app ID
    const statusMap: Record<string, any> = {};
    for (const appId of appIds) {
      const sandbox = sandboxes.find((s) => s.app_id === appId);

      if (!sandbox) {
        statusMap[appId] = {
          status: "not_found",
          message: "App not found",
        };
        continue;
      }

      let status = "in_progress";
      let message = "Building your app...";

      const sandboxIsActive =
        sandbox.sandbox_status === "active" ||
        sandbox.sandbox_status === "paused";
      const appIsActive =
        sandbox.app_status === "active" || sandbox.app_status === "paused";

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

      statusMap[appId] = {
        status,
        message,
        sandbox_status: sandbox.sandbox_status,
        app_status: sandbox.app_status,
        updated_at: sandbox.sandbox_updated_at,
      };
    }

    return NextResponse.json({ statuses: statusMap });
  } catch (error) {
    console.error("Batch build status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
