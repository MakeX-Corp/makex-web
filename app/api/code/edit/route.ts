import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

export async function POST(req: Request) {
  const { apiUrl, path, content, operation, isFolder } = await req.json();

  if (!apiUrl || !path) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;
  const { user } = userResult;

  try {
    const client = createFileBackendApiClient(apiUrl);
    const sanitizedPath = path.replace(/^\/+/, "");

    if (operation && operation === "delete") {
      if (isFolder) {
        const responseData = await client.delete("/directory", {
          path: sanitizedPath,
        });
        return NextResponse.json({ success: true, data: responseData });
      } else {
        const responseData = await client.delete("/file", {
          path: sanitizedPath,
        });
        return NextResponse.json({ success: true, data: responseData });
      }
    } else {
      if (isFolder) {
        const responseData = await client.post("/directory", {
          path: sanitizedPath,
        });
        return NextResponse.json({ success: true, data: responseData });
      } else {
        // this is for file editing/creation
        // The backend will handle creating the file if it doesn't exist
        const responseData = await client.post("/file", {
          path: sanitizedPath,
          content: content || "",
        });
        return NextResponse.json({ success: true, data: responseData });
      }
    }
  } catch (error: any) {
    console.error("File operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform file operation" },
      { status: 500 }
    );
  }
}
