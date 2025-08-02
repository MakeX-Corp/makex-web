import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { listDirectory, createDirectory, deleteDirectory } from "@/utils/server/e2b";

export async function GET(req: NextRequest) {
  // Get the user API client
  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;

  const { supabase, user } = userResult;



  // Get and decode the path parameter
  const encodedPath = req.nextUrl.searchParams.get("path") ?? "/";
  const path = decodeURIComponent(encodedPath);
  const appId = req.nextUrl.searchParams.get("appId") ?? "";

  if (!appId) {
    return NextResponse.json(
      { error: "appId parameter is required" },
      { status: 400 },
    );
  }

  try {
    // Get the sandbox_id from the user_sandboxes table
    const { data: sandboxData, error: sandboxError } = await supabase
      .from("user_sandboxes")
      .select("sandbox_id")
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (sandboxError || !sandboxData?.sandbox_id) {
      return NextResponse.json(
        { error: "Sandbox not found" },
        { status: 404 },
      );
    }

    const sandboxId = sandboxData.sandbox_id;
    const sanitizedPath = (path && path !== "/") ? path : "/app/expo-app";


    // Use e2b listDirectory function
    const directoryListing = await listDirectory(sandboxId, sanitizedPath);

    // Parse the ls -la output and transform it to the expected format
    const lines = directoryListing.stdout.split('\n').filter(line => line.trim());
    const items = [];

    for (const line of lines) {
      // Skip empty lines and summary lines
      if (!line.trim() || line.includes('total')) {
        continue;
      }

      // Parse ls -la output format
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 9) {
        const permissions = parts[0];
        const size = parseInt(parts[4]) || 0;
        const name = parts[8];
        
        // Skip . and .. entries
        if (name === '.' || name === '..') {
          continue;
        }

        // Skip specific directories and files
        if (name === '.expo' || name === '.git' || name === 'node_modules' || name === '.env.local') {
          continue;
        }

        // Determine if it's a directory or file
        const isDirectory = permissions.startsWith('d');
        const itemPath = sanitizedPath === "" ? `/${name}` : `${sanitizedPath}/${name}`;

        items.push({
          type: isDirectory ? 'folder' : 'file',
          name: name,
          path: itemPath,
          ...(isDirectory ? {} : { size: size })
        });
      }
    }

    // Sort items: folders first, then files, both alphabetically
    items.sort((a, b) => {
      // First sort by type (folders before files)
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Directory operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform directory operation" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { appId, path } = await req.json();

  if (!appId || !path) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;
  const { supabase, user } = userResult;

  try {
    // Get the sandbox_id from the user_sandboxes table
    const { data: sandboxData, error: sandboxError } = await supabase
      .from("user_sandboxes")
      .select("sandbox_id")
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (sandboxError || !sandboxData?.sandbox_id) {
      return NextResponse.json(
        { error: "Sandbox not found" },
        { status: 404 },
      );
    }

    const sandboxId = sandboxData.sandbox_id;
    const sanitizedPath = (path && path !== "/") ? path : "/app/expo-app";

    // Use e2b createDirectory function
    const responseData = await createDirectory(sandboxId, sanitizedPath);
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("Directory operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform directory operation" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { appId, path } = await req.json();
  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;
  const { supabase, user } = userResult;

  try {
    // Get the sandbox_id from the user_sandboxes table
    const { data: sandboxData, error: sandboxError } = await supabase
      .from("user_sandboxes")
      .select("sandbox_id")
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (sandboxError || !sandboxData?.sandbox_id) {
      return NextResponse.json(
        { error: "Sandbox not found" },
        { status: 404 },
      );
    }

    const sandboxId = sandboxData.sandbox_id;
    const sanitizedPath = (path && path !== "/") ? path : "/app/expo-app";

    // Use e2b deleteDirectory function
    const responseData = await deleteDirectory(sandboxId, sanitizedPath);
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("Directory operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform directory operation" },
      { status: 500 },
    );
  }
}
