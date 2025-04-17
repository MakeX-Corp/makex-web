import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

export async function POST(req: Request) {
  try {
    const { appUrl, appId } = await req.json();

    // Get user info and validate authentication
    const userResult = await getSupabaseWithUser(req);
    if (userResult instanceof NextResponse) return userResult;
    const { user } = userResult;

    try {
      const client = createFileBackendApiClient(appUrl);
      const { data, headers } = await client.getFile("/export-code");

      // Convert Axios headers to a format compatible with Response
      const responseHeaders = new Headers();
      Object.entries(headers).forEach(([key, value]) => {
        if (value) {
          responseHeaders.set(key, String(value));
        }
      });
      responseHeaders.set("Content-Type", "application/zip");
      responseHeaders.set("Content-Disposition", 'attachment; filename="export.zip"');

      return new Response(data, {
        status: 200,
        headers: responseHeaders,
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
