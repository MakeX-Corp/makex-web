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
