import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

export async function POST(req: Request) {
  try {
    const { apiUrl, path, content, operation, isFolder } = await req.json();

    if (!apiUrl || !path || !operation) {
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

      if (operation === "create") {
        if (isFolder) {
          // Create a new directory
          const responseData = await client.post("/directory", {
            path: sanitizedPath,
          });
          return NextResponse.json({ success: true, data: responseData });
        } else {
          // Create a new file
          const responseData = await client.post("/file", {
            path: sanitizedPath,
            content: content || "",
          });
          return NextResponse.json({ success: true, data: responseData });
        }
      } else if (operation === "delete") {
        // Delete a file or directory
        const responseData = await client.delete("/file", {
          path: sanitizedPath,
        });
        return NextResponse.json({ success: true, data: responseData });
      } else {
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error("File operation error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to perform file operation" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
