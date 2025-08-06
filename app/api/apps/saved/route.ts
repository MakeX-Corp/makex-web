import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

// Fake data for saved apps
const fakeSavedApps = [
  {
    id: "1",
    app_url: "https://example.com/app1",
    display_name: "Weather Widget Pro",
    app_name: "weather-widget-pro",
    category: "Productivity",
    description:
      "A beautiful and customizable weather widget for your home screen with real-time updates",
    author: "John Doe",
    likes: 156,
    downloads: 1200,
    savedAt: "2024-01-15T10:30:00Z",
    isInstalled: true,
    preview_image: "https://picsum.photos/60/60?random=1",
    rating: 4.5,
    tags: ["Weather", "Widget"],
  },
  {
    id: "2",
    app_url: "https://example.com/app2",
    display_name: "Task Manager Plus",
    app_name: "task-manager-plus",
    category: "Productivity",
    description:
      "Simple and effective task management app with cloud sync and reminders",
    author: "Jane Smith",
    likes: 89,
    downloads: 850,
    savedAt: "2024-01-10T14:20:00Z",
    isInstalled: false,
    preview_image: "https://picsum.photos/60/60?random=2",
    rating: 4.2,
    tags: ["Tasks", "Productivity"],
  },
  {
    id: "3",
    app_url: "https://example.com/app3",
    display_name: "Photo Editor Studio",
    app_name: "photo-editor-studio",
    category: "Creative",
    description:
      "Advanced photo editing tools with AI-powered filters and effects",
    author: "Mike Johnson",
    likes: 234,
    downloads: 2100,
    savedAt: "2024-01-08T09:15:00Z",
    isInstalled: true,
    preview_image: "https://picsum.photos/60/60?random=3",
    rating: 4.7,
    tags: ["Photo", "Editing"],
  },
  {
    id: "4",
    app_url: "https://example.com/app4",
    display_name: "Fitness Tracker Elite",
    app_name: "fitness-tracker-elite",
    category: "Health",
    description:
      "Track your workouts and progress with detailed analytics and social features",
    author: "Sarah Wilson",
    likes: 312,
    downloads: 1800,
    savedAt: "2024-01-05T16:45:00Z",
    isInstalled: false,
    preview_image: "https://picsum.photos/60/60?random=4",
    rating: 4.3,
    tags: ["Fitness", "Health"],
  },
  {
    id: "5",
    app_url: "https://example.com/app5",
    display_name: "Music Player Pro",
    app_name: "music-player-pro",
    category: "Entertainment",
    description:
      "High-quality music player with advanced audio controls and playlist management",
    author: "Alex Brown",
    likes: 567,
    downloads: 3200,
    savedAt: "2024-01-03T11:30:00Z",
    isInstalled: true,
    preview_image: "https://picsum.photos/60/60?random=5",
    rating: 4.8,
    tags: ["Music", "Audio"],
  },
  {
    id: "6",
    app_url: "https://example.com/app6",
    display_name: "Recipe Finder",
    app_name: "recipe-finder",
    category: "Lifestyle",
    description:
      "Discover new recipes based on ingredients you have and dietary preferences",
    author: "Emma Davis",
    likes: 189,
    downloads: 950,
    savedAt: "2024-01-01T13:20:00Z",
    isInstalled: false,
    preview_image: "https://picsum.photos/60/60?random=6",
    rating: 4.1,
    tags: ["Cooking", "Food"],
  },
  {
    id: "7",
    app_url: "https://example.com/app7",
    display_name: "Note Taking App",
    app_name: "note-taking-app",
    category: "Productivity",
    description:
      "Simple and elegant note taking with markdown support and cloud sync",
    author: "David Brown",
    likes: 178,
    downloads: 1200,
    savedAt: "2023-12-28T15:10:00Z",
    isInstalled: true,
    preview_image: "https://picsum.photos/60/60?random=7",
    rating: 4.6,
    tags: ["Notes", "Markdown"],
  },
  {
    id: "8",
    app_url: "https://example.com/app8",
    display_name: "Meditation Guide",
    app_name: "meditation-guide",
    category: "Health",
    description:
      "Guided meditation sessions with calming sounds and breathing exercises",
    author: "Lisa Chen",
    likes: 245,
    downloads: 1500,
    savedAt: "2023-12-25T08:45:00Z",
    isInstalled: false,
    preview_image: "https://picsum.photos/60/60?random=8",
    rating: 4.4,
    tags: ["Meditation", "Wellness"],
  },
];

// Helper function to filter apps based on search and category
function filterApps(apps: any[], search?: string, category?: string) {
  return apps.filter((app) => {
    const matchesSearch =
      !search ||
      app.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.description?.toLowerCase().includes(search.toLowerCase()) ||
      app.author?.toLowerCase().includes(search.toLowerCase()) ||
      app.tags?.some((tag: string) =>
        tag.toLowerCase().includes(search.toLowerCase()),
      );

    const matchesCategory =
      !category || category === "All" || app.category === category;

    return matchesSearch && matchesCategory;
  });
}

// GET /api/apps/saved - Get saved apps with optional search and category filtering
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const result = await getSupabaseWithUser(request as NextRequest);

    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { user } = result;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Filter apps based on search and category
    let filteredApps = filterApps(
      fakeSavedApps,
      search || undefined,
      category || undefined,
    );

    // Apply pagination
    const total = filteredApps.length;
    const paginatedApps = filteredApps.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return NextResponse.json({
      apps: paginatedApps,
      total,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching saved apps:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved apps" },
      { status: 500 },
    );
  }
}

// POST /api/apps/saved - Save an app to user's saved list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId } = body;

    if (!appId) {
      return NextResponse.json({ error: "appId is required" }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Validate the user is authenticated
    // 2. Check if the app exists in the discover apps
    // 3. Add the app to the user's saved apps in the database
    // 4. Return success response

    console.log(`Saving app with ID: ${appId} for user`);

    return NextResponse.json({
      success: true,
      message: "App saved successfully",
      appId,
    });
  } catch (error) {
    console.error("Error saving app:", error);
    return NextResponse.json({ error: "Failed to save app" }, { status: 500 });
  }
}

// DELETE /api/apps/saved/[appId] - Remove an app from saved list
export async function DELETE(
  request: NextRequest,
  { params }: { params: { appId: string } },
) {
  try {
    const appId = params.appId;

    if (!appId) {
      return NextResponse.json({ error: "appId is required" }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Validate the user is authenticated
    // 2. Check if the app is in the user's saved apps
    // 3. Remove the app from the user's saved apps in the database
    // 4. Return success response

    console.log(`Removing app with ID: ${appId} from user's saved apps`);

    return NextResponse.json({
      success: true,
      message: "App removed from saved apps successfully",
      appId,
    });
  } catch (error) {
    console.error("Error removing saved app:", error);
    return NextResponse.json(
      { error: "Failed to remove saved app" },
      { status: 500 },
    );
  }
}

// Additional helper endpoints for better API structure

// GET /api/apps/saved/count - Get count of saved apps
export async function GET_COUNT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const filteredApps = filterApps(
      fakeSavedApps,
      search || undefined,
      category || undefined,
    );

    return NextResponse.json({
      count: filteredApps.length,
    });
  } catch (error) {
    console.error("Error getting saved apps count:", error);
    return NextResponse.json(
      { error: "Failed to get saved apps count" },
      { status: 500 },
    );
  }
}

// GET /api/apps/saved/categories - Get available categories for saved apps
export async function GET_CATEGORIES() {
  try {
    const categories = [...new Set(fakeSavedApps.map((app) => app.category))];

    return NextResponse.json({
      categories: ["All", ...categories],
    });
  } catch (error) {
    console.error("Error getting saved apps categories:", error);
    return NextResponse.json(
      { error: "Failed to get saved apps categories" },
      { status: 500 },
    );
  }
}

// POST /api/apps/saved/bulk - Save multiple apps at once
export async function POST_BULK(request: NextRequest) {
  try {
    const body = await request.json();
    const { appIds } = body;

    if (!appIds || !Array.isArray(appIds)) {
      return NextResponse.json(
        { error: "appIds array is required" },
        { status: 400 },
      );
    }

    // In a real implementation, you would:
    // 1. Validate the user is authenticated
    // 2. Check if all apps exist in the discover apps
    // 3. Add all apps to the user's saved apps in the database
    // 4. Return success response

    console.log(`Saving ${appIds.length} apps for user:`, appIds);

    return NextResponse.json({
      success: true,
      message: `${appIds.length} apps saved successfully`,
      savedCount: appIds.length,
    });
  } catch (error) {
    console.error("Error bulk saving apps:", error);
    return NextResponse.json(
      { error: "Failed to bulk save apps" },
      { status: 500 },
    );
  }
}

// DELETE /api/apps/saved/bulk - Remove multiple apps from saved list
export async function DELETE_BULK(request: NextRequest) {
  try {
    const body = await request.json();
    const { appIds } = body;

    if (!appIds || !Array.isArray(appIds)) {
      return NextResponse.json(
        { error: "appIds array is required" },
        { status: 400 },
      );
    }

    // In a real implementation, you would:
    // 1. Validate the user is authenticated
    // 2. Check if all apps are in the user's saved apps
    // 3. Remove all apps from the user's saved apps in the database
    // 4. Return success response

    console.log(
      `Removing ${appIds.length} apps from user's saved apps:`,
      appIds,
    );

    return NextResponse.json({
      success: true,
      message: `${appIds.length} apps removed from saved apps successfully`,
      removedCount: appIds.length,
    });
  } catch (error) {
    console.error("Error bulk removing saved apps:", error);
    return NextResponse.json(
      { error: "Failed to bulk remove saved apps" },
      { status: 500 },
    );
  }
}
