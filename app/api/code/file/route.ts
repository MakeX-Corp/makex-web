import { NextRequest, NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function GET(req: NextRequest) {
  // Get the user API client
  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;

  // Get and decode the path parameter
  const encodedPath = req.nextUrl.searchParams.get("path") ?? "";
  const path = decodeURIComponent(encodedPath);
  const apiUrl = req.nextUrl.searchParams.get("api_url") ?? "";

  const fileClient = createFileBackendApiClient(apiUrl);

  const data = await fileClient.get(`/code?path=${encodeURIComponent(path)}`);

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { apiUrl, path, content } = await req.json();

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

    // this is for file editing/creation
    // The backend will handle creating the file if it doesn't exist
    const responseData = await client.post("/file", {
      path: sanitizedPath,
      content: content || "",
    });
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("File operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform file operation" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { apiUrl, path } = await req.json();
  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;

  try {
    const client = createFileBackendApiClient(apiUrl);
    const sanitizedPath = path.replace(/^\/+/, "");

    const responseData = await client.delete("/file", {
      path: sanitizedPath,
    });
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("File operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform file operation" },
      { status: 500 }
    );
  }
}
