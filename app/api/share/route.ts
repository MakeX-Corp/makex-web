import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('share_id');

    if (!shareId) {
      return NextResponse.json({ error: "share_id is required" }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();

    const { data, error } = await supabase
      .from("url_mappings")
      .select("*")
      .eq("share_id", shareId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Error fetching URL mapping" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in share route:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
