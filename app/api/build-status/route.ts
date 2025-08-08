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
        { status: 400 },
      );
    }

    // Fetch all matching sandboxes in one query
    const { data: sandboxes, error } = await supabase
      .from("user_sandboxes")
      .select("app_id, sandbox_status, sandbox_updated_at, expo_status")
      .in("app_id", appIds)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase batch query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch app statuses" },
        { status: 500 },
      );
    }

    // Fetch coding status from user_apps table
    const { data: apps, error: appsError } = await supabase
      .from("user_apps")
      .select("id, coding_status")
      .in("id", appIds)
      .eq("user_id", user.id);

    if (appsError) {
      console.error("Supabase apps batch query error:", appsError);
      return NextResponse.json(
        { error: "Failed to fetch app coding statuses" },
        { status: 500 },
      );
    }

    // Map results by app ID
    const statusMap: Record<string, any> = {};
    for (const appId of appIds) {
      const sandbox = sandboxes.find((s) => s.app_id === appId);
      const app = apps.find((a) => a.id === appId);

      if (!sandbox || !app) {
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
      const codingIsFinished = app.coding_status === "finished";

      const expoIsActive =
        sandbox.expo_status === "bundled" || sandbox.expo_status === null;
      if (sandboxIsActive && codingIsFinished && expoIsActive) {
        status = "complete";
        message = "Your app is ready!";
      } else if (sandbox.sandbox_status === "error") {
        status = "failed";
        message = "Build failed";
      } else if (app.coding_status === "changing") {
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
        coding_status: app.coding_status,
        updated_at: sandbox.sandbox_updated_at,
      };
    }

    return NextResponse.json({ statuses: statusMap });
  } catch (error) {
    console.error("Batch build status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
