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

    // Map results by app ID based only on coding_status
    const statusMap: Record<string, any> = {};
    for (const appId of appIds) {
      const app = apps.find((a) => a.id === appId);

      if (!app) {
        statusMap[appId] = {
          status: "not_found",
          message: "App not found",
        };
        continue;
      }

      let status = "in_progress";
      let message = "Building your app...";

      // Simple status mapping based only on coding_status
      if (app.coding_status === "finished") {
        status = "complete";
      } else if (app.coding_status === "changing") {
        status = "in_progress";
        message = "Changing app...";
      }

      statusMap[appId] = {
        status,
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
