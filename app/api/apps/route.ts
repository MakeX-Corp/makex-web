import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { Tables } from "@/types/database.types";

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
    const category = searchParams.get("category"); // For future use

    console.log("Page:", page);
    console.log("Limit:", limit);
    console.log("Category:", category);

    // Validate pagination parameters
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

    // Build the query to join app_listing_info with user_apps
    let query = supabase
      .from("app_listing_info")
      .select(
        `
        *,
        user_apps!url_mappings_app_id_fkey (
          display_name,
        )
      `,
        { count: "exact" },
      )
      .neq("user_apps.user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data: apps, error, count } = await query;

    console.log("apps", apps);

    if (error) {
      console.error("Error fetching apps:", error);
      return NextResponse.json(
        { error: "Failed to fetch apps" },
        { status: 500 },
      );
    }

    // Transform the data to flatten the joined structure
    const transformedApps: AppListingInfo[] = (apps || []).map((app: any) => ({
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
      // Flatten the joined user_apps data
      display_name: app.user_apps?.display_name || null,
    }));

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
