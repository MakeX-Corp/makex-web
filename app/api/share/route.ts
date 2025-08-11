import { NextResponse, NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("share_id");
    const appId = searchParams.get("app_id");

    if (!shareId && !appId) {
      return NextResponse.json(
        { error: "Either share_id or app_id is required" },
        { status: 400 },
      );
    }

    const supabase = await getSupabaseAdmin();

    let query = supabase.from("app_listing_info").select("*");

    if (shareId) {
      query = query.eq("share_id", shareId);
    } else if (appId) {
      query = query.eq("app_id", appId);
    }

    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json(
        { error: "Error fetching URL mapping" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in share route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
