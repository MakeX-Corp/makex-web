import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function GET(req: Request) {
  try {
    const userResult = await getSupabaseWithUser(req);
    if (userResult instanceof NextResponse) return userResult;
    const { supabase, user } = userResult;

    const today = new Date().toISOString().split("T")[0];
    const { count, error: countError } = await supabase
      .from("app_chat_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", today)
      .lt(
        "created_at",
        new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString()
      );

    if (countError) {
      return NextResponse.json(
        { error: "Failed to fetch message limit" },
        { status: 500 }
      );
    }
    console.log("count", count);

    const MAX_DAILY_MESSAGES = parseInt(process.env.MAX_DAILY_MESSAGES || "20");
    const remaining = MAX_DAILY_MESSAGES - (count || 0);

    return NextResponse.json({ remaining });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
