import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function POST(request: Request) {
  const result = await getSupabaseWithUser(request as NextRequest);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;
  const { supabase, user } = result;

  const body = await request.json();
  const appId = body.appId;
  
  if (!appId) {
    return NextResponse.json(
      { error: "App ID is required" },
      { status: 400 }
    );
  }

  // Fetch the app from the database
  const { data: app, error } = await supabase
    .from("user_apps")
    .select("*")
    .eq("id", appId)
    .eq("user_id", user.id)
    .single();

  console.log('app data',app)
  
  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch app", details: error.message },
      { status: error.code === "PGRST116" ? 404 : 500 }
    );
  }

  if (!app) {
    return NextResponse.json(
      { error: "App not found" },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ success: true, app }, { status: 200 });
}
