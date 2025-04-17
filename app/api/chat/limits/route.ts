import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getDailyMessageCount } from "@/utils/check-daily-limit";
import { getMessageLimit } from "@/utils/check-daily-limit";

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
        { error: "Failed to fetch message count" },
        { status: 500 }
      );
    }

    const maxDailyMessages = await getMessageLimit(supabase, user.id);
    console.log("maxDailyMessages", maxDailyMessages);
    const remaining = maxDailyMessages - (count || 0);

    return NextResponse.json({
      remaining,
      total: maxDailyMessages,
      used: count || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
