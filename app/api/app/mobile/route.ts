import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function GET(request: NextRequest) {
  try {
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const { searchParams } = new URL(request.url);
    const manifestUrl = searchParams.get("manifestUrl");

    if (!manifestUrl) {
      return NextResponse.json(
        { error: "manifestUrl parameter is required" },
        { status: 400 }
      );
    }

    console.log("Looking up app by manifest URL:", manifestUrl);

    const formattedUrl = manifestUrl.replace("exp://", "https://");
    const { data: app, error } = await supabase
      .from("user_apps")
      .select("*")
      .eq("app_url", formattedUrl)
      .eq("user_id", user?.id)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          error: "App not found for the given manifest URL",
          details: error.message,
        },
        { status: error.code === "PGRST116" ? 404 : 500 }
      );
    }

    return NextResponse.json({
      id: app.id,
      name: app.display_name || app.app_name,
      app_url: app.app_url,
      api_url: app.api_url,
      created_at: app.created_at,
      updated_at: app.updated_at,
    });
  } catch (error) {
    console.error("Internal error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
