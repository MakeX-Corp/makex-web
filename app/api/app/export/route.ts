import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function POST(req: Request) {
  try {
    const { appUrl, appId } = await req.json();

    // Get user info and validate authentication
    const userResult = await getSupabaseWithUser(req);
    if (userResult instanceof NextResponse) return userResult;
    const { user } = userResult;
    let apiUrl = appUrl.replace("makex.app", "fly.dev");
    const API_BASE = apiUrl + ":8001/export-code";

    try {
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: {
          "X-API-Key": process.env.FILE_BACKEND_API_KEY || "",
        },
      });
      if (!response.ok) {
        throw new Error(
          `Export failed: ${response.status} ${response.statusText}`
        );
      }

      const buffer = await response.arrayBuffer();

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="export.zip"',
        },
      });
    } catch (error: any) {
      console.error("Export error:", error);
      return NextResponse.json(
        { error: error.message || "Export failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Export route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
