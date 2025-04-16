import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

// Add this function to handle checkpoint restore
export async function POST(request: Request) {
  const { appId } = await request.json();
  const userResult = await getSupabaseWithUser(request);

  // query supabase app_chat_history to get the commit hash
  if (userResult instanceof NextResponse) return userResult;
  const { supabase, user } = userResult;
  const { data, error } = await supabase
    .from("user_apps")
    .select("*")
    .eq("id", appId)
    .single();

  // Transform the URL similar to chat route
  let apiUrl = data.app_url.replace("makex.app", "fly.dev");
  const API_BASE = apiUrl + ":8001";

  if (error) {
    return NextResponse.json(
      { error: "Failed to get app details" },
      { status: 500 }
    );
  }

  console.log("data", data);
  const fileBackendClient = createFileBackendApiClient(API_BASE);

  try {
    const responseData = await fileBackendClient.post("/checkpoint/restore", {
      name: data.initial_commit,
    });

    console.log("responseData", responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to restore checkpoint" },
      { status: 500 }
    );
  }
}
