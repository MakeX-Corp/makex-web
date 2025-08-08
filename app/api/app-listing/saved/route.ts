import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

interface SavedAppInfo {
  id: number;
  created_at: string;
  app_url: string | null;
  category: string | null;
  description: string | null;
  author: string | null;
  downloads: number;
  image: string | null;
  rating: number | null;
  tags: string[] | null;
  display_name: string | null;
  saved_at: string;
}

interface SavedAppsResponse {
  apps: SavedAppInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

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

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const category = searchParams.get("category");

  if (page < 1) {
    return NextResponse.json(
      { error: "Page must be greater than 0" },
      { status: 400 },
    );
  }

  if (limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: "Limit must be between 1 and 100" },
      { status: 400 },
    );
  }

  // Calculate offset
  const offset = (page - 1) * limit;

  // Build the query with joins
  let query = supabase
    .from("user_saved_apps")
    .select(
      `
      created_at,
      app_listing_info!inner (
        id,
        app_url,
        category,
        description,
        author,
        downloads,
        created_at,
        image,
        rating,
        tags,
        user_apps!inner (
          display_name
        )
      )
    `,
      { count: "exact" },
    )
    .eq("user_id", user.id);

  // Apply category filter if provided
  if (category) {
    query = query.eq("app_listing_info.category", category);
  }

  const {
    data: savedApps,
    error,
    count,
  } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  console.log("savedApps", savedApps);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch saved apps", details: error.message },
      { status: 500 },
    );
  }

  if (!savedApps || savedApps.length === 0) {
    return NextResponse.json(
      {
        apps: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      },
      { status: 200 },
    );
  }

  // Transform the data to flatten the joined structure
  const apps: SavedAppInfo[] = savedApps.map((saved: any) => ({
    ...saved.app_listing_info,
    display_name: saved.app_listing_info.user_apps.display_name,
  }));

  // Calculate pagination metadata
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Prepare response
  const response: SavedAppsResponse = {
    apps,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };

  return NextResponse.json(response, { status: 200 });
}
