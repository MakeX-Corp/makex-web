import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse, NextRequest } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

// Add this function to handle checkpoint restore
export async function POST(request: Request) {
  const { appId } = await request.json();
  const userResult = await getSupabaseWithUser(request as NextRequest);
  if ("error" in userResult) return userResult.error;
  // query supabase app_chat_history to get the commit hash
  if (userResult instanceof NextResponse) return userResult;
  const { supabase, user } = userResult;
  const { data, error } = await supabase.from("user_apps").select("*").eq("id", appId).single();

  // Transform the URL similar to chat route

  if (error) {
    return NextResponse.json({ error: "Failed to get app details" }, { status: 500 });
  }

  console.log("data", data);
  const fileBackendClient = createFileBackendApiClient(data.api_url);

  try {
    const responseData = await fileBackendClient.post("/checkpoint/restore", {
      name: data.initial_commit,
    });

    console.log("responseData", responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to restore checkpoint" }, { status: 500 });
  }
}
