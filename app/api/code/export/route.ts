import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { downloadGitRepositoryZip } from "@/utils/server/freestyle";

export async function POST(req: Request) {
  try {
    const { appId } = await req.json();

    // Get user info and validate authentication
    const userResult = await getSupabaseWithUser(req as NextRequest);
    if (userResult instanceof NextResponse || "error" in userResult)
      return userResult;
    const { user, supabase } = userResult;

    // Get the app details to find the git repository ID
    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("git_repo_id, app_name")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: "App not found or access denied" },
        { status: 404 }
      );
    }

    if (!app.git_repo_id) {
      return NextResponse.json(
        { error: "No Git repository found for this app" },
        { status: 400 }
      );
    }

    // Download the zip from Freestyle Git API
    const zipBuffer = await downloadGitRepositoryZip(app.git_repo_id);

    // Set response headers for file download
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "application/zip");
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${app.app_name || 'export'}.zip"`
    );

    return new Response(zipBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Export route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
