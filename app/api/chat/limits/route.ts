import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getDailyMessageCount } from "@/utils/check-daily-limit";

export async function GET(req: Request) {
  try {
    const userResult = await getSupabaseWithUser(req);
    if (userResult instanceof NextResponse) return userResult;
    const { supabase, user } = userResult;

    const { count, error: countError } = await getDailyMessageCount(
      supabase,
      user
    );

    if (countError) {
      return NextResponse.json(
        { error: "Failed to fetch message limit" },
        { status: 500 }
      );
    }

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
