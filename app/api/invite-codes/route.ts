import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    const { user } = result;
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const body = await request.json();
    const inviteCode = body.inviteCode;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Check if invite code exists and is valid
    const { data, error } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", inviteCode)
        .single();

    console.log(data);

    if (error || !data) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    // Check if code is already used
    if (data.user_id) {
      return NextResponse.json({ error: "This invite code has already been used" }, { status: 400 });
    }

    // Assign the invite code to this user
    try {
      const { data: updateData, error: updateError } = await supabase
        .from("invite_codes")
        .update({ user_id: user.id })
        .eq("code", inviteCode)
        .select();

      console.log(updateData);
      console.log(updateError);
    } catch (error) {
      console.error("Error updating invite code:", error);
      return NextResponse.json({ error: "Failed to update invite code" }, { status: 500 });
    }

    return NextResponse.json({ message: "Invite code applied successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error applying invite code:", error);
    return NextResponse.json({ error: "Failed to apply invite code" }, { status: 500 });
  }
}
