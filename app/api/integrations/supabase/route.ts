import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  const { supabase, user } = result;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("integration_type", "supabase");

  if (error) {
    return NextResponse.json(
      { error: "Error fetching user integrations" },
      { status: 500 },
    );
  }

  return NextResponse.json({ exists: data && data.length > 0 });
}
