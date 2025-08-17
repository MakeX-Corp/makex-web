import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

// Add this enhanced logging to your build status API route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
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
        { status: 400 },
      );
    }

    // Query the user_apps table for coding status
    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("coding_status")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if (appError) {
      console.error("Supabase app query error:", appError);
      if (appError.code === "PGRST116") {
        return NextResponse.json({ error: "App not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch app coding status" },
        { status: 500 },
      );
    }

    // Simple status mapping based only on coding_status
    let status = "in_progress";

    if (app.coding_status === "finished") {
      status = "complete";
    } else if (app.coding_status === "changing") {
      status = "in_progress";
    }

    const response = {
      status,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Build status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
