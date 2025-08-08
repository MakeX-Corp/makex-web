import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function POST(request: NextRequest) {
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;

  const { supabase, user } = result;

  try {
    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json({ error: "Missing appId" }, { status: 400 });
    }

    const { error } = await supabase.from("user_saved_apps").insert({
      app_listing_info_id: Number(appId),
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already saved" }, { status: 200 });
      }
      return NextResponse.json(
        { error: "Failed to save app", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "App saved" }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;

  const { user } = result;
  const supabase = await getSupabaseAdmin();

  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");
  console.log("appId", appId);
  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_saved_apps")
    .delete()
    .match({
      app_listing_info_id: Number(appId),
      user_id: user.id,
    });

  if (error) {
    return NextResponse.json(
      { error: "Failed to unsave app", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "App unsaved" }, { status: 200 });
}

export async function GET(request: NextRequest) {
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;

  const { user } = result;
  const supabase = await getSupabaseAdmin();

  // 1) Get the saved rows for this user (IDs + saved time)
  const { data: saved, error: savedErr } = await supabase
    .from("user_saved_apps")
    .select("app_listing_info_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  console.log("saved", saved);
  if (savedErr) {
    return NextResponse.json(
      { error: "Failed to fetch saved rows", details: savedErr.message },
      { status: 500 },
    );
  }

  if (!saved || saved.length === 0) {
    return NextResponse.json({ apps: [] }, { status: 200 });
  }

  const ids = saved.map((s: any) => s.app_listing_info_id);

  console.log("ids", ids);
  // 2) Fetch the app rows by ID
  const { data: appsData, error: appsErr } = await supabase
    .from("app_listing_info")
    .select(
      "id, app_url, category, description, author, downloads, created_at, image, rating, tags",
    )
    .in("id", ids);

  if (appsErr) {
    return NextResponse.json(
      { error: "Failed to fetch app details", details: appsErr.message },
      { status: 500 },
    );
  }

  // Preserve the saved order; attach saved_at if you want it
  const byId = new Map((appsData ?? []).map((a: any) => [a.id, a]));
  const apps = saved
    .map((s: any) => {
      const app = byId.get(s.app_listing_info_id);
      return app ? { ...app, saved_at: s.created_at } : null;
    })
    .filter(Boolean);

  return NextResponse.json({ apps }, { status: 200 });
}
