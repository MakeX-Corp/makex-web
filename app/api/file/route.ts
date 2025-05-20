import { NextRequest, NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function GET(req: NextRequest) {
  // Get the user API client
  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;
  const path = req.nextUrl.searchParams.get("path") ?? "";
  const apiUrl = req.nextUrl.searchParams.get("api_url") ?? "";
  //const api_url = "http://localhost:8001";

  const fileClient = createFileBackendApiClient(apiUrl);

  const data = await fileClient.get(`/code?path=${path}`);

  return NextResponse.json(data);
}
