import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: Request) {
  const result = await getSupabaseWithUser(req as NextRequest);
  if (result instanceof NextResponse) return result;
  //@ts-ignore
  const { supabase, user } = result;

  const { deviceToken } = await req.json();
  console.log("deviceToken", deviceToken);
  if (!deviceToken) {
    return NextResponse.json({ error: "Missing device token" }, { status: 400 });
  }

  const { data, error } = await supabase.from("user_devices").upsert(
    {
      user_id: user.id,
      device_token: deviceToken,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "device_token" }
  );

  if (error) {
    console.error("Error saving token:", error);
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
