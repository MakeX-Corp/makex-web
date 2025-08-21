import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

interface AppListingInfo {
  id: number;
  created_at: string;
  app_id: string;
  share_url: string | null;
  web_url: string | null;
  app_url: string | null;
  dub_id: string | null;
  updated_at: string | null;
  dub_key: string | null;
  share_id: string;
  image: string | null;
  description: string | null;
  rating: number | null;
  downloads: number;
  display_name: string;
  author: string;
}

interface AppsResponse {
  apps: AppListingInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const result = await getSupabaseWithUser(request as NextRequest);

    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { user } = result;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

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

    // Get admin Supabase client for server-side operations
    const supabase = await getSupabaseAdmin();

    const rel = "user_apps!app_id"; // join via app_listing_info.app_id -> user_apps.id

    // Get saved app IDs for the current user
    let savedAppIds: number[] = [];
    if (user?.id) {
      const { data: savedApps } = await supabase
        .from("user_saved_apps")
        .select("app_listing_info_id")
        .eq("user_id", user.id);

      savedAppIds =
        savedApps?.map((saved: any) => saved.app_listing_info_id) || [];
    }

    let query = supabase.from("app_listing_info").select(
      `
      *,
      ${rel} ( display_name )
    `,
      { count: "exact" },
    );

    // Filter listings that are public
    query = query.eq("is_public", true);

    // 🔎 optional category filter
    if (category) {
      query = query.eq("category", category);
    }

    // Exclude apps that the user has already saved
    if (user?.id && savedAppIds.length > 0) {
      query = query.not("id", "in", `(${savedAppIds.join(",")})`);
    }

    const {
      data: apps,
      error: appsError,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (appsError) {
      console.error("Error fetching apps:", appsError);
      return NextResponse.json(
        { error: "Failed to fetch apps" },
        { status: 500 },
      );
    }

    // Transform the data to flatten the joined structure
    let transformedApps: AppListingInfo[] = (apps || []).map((app: any) => ({
      id: app.id,
      created_at: app.created_at,
      app_id: app.app_id,
      share_url: app.share_url,
      web_url: app.web_url,
      app_url: app.app_url,
      dub_id: app.dub_id,
      updated_at: app.updated_at,
      dub_key: app.dub_key,
      share_id: app.share_id,
      image: app.image,
      description: app.description,
      rating: app.rating,
      downloads: app.downloads,
      display_name: app.user_apps?.display_name || "",
      author: app.author,
      tags: app.tags,
      category: app.category,
    }));

    // Filter out apps with no author and no description
    transformedApps = transformedApps.filter(
      (app) => app.author || app.description,
    );

    // Simple search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      transformedApps = transformedApps.filter(
        (app) =>
          app.display_name?.toLowerCase().includes(searchLower) ||
          app.description?.toLowerCase().includes(searchLower) ||
          app.author?.toLowerCase().includes(searchLower),
      );
    }

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Prepare response
    const response: AppsResponse = {
      apps: transformedApps,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in apps endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
