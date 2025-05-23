import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse, NextRequest } from "next/server";
import { EnvVarManager } from "@/utils/server/env-var-manager";

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    const { supabase, user } = result as { supabase: any; user: any };
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const appUrl = searchParams.get('appUrl');

    if (!appUrl) {
      return NextResponse.json(
        { error: "appUrl is required" },
        { status: 400 }
      );
    }

    const envVarManager = await EnvVarManager.create(appUrl);
    const envVars = await envVarManager.getAll();

    return NextResponse.json(Object.fromEntries(envVars));
  } catch (error) {
    console.error("Get env vars error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    const { supabase, user } = result as { supabase: any; user: any };
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const body = await request.json();
    const { appUrl, key, value } = body;

    if (!appUrl || !key || value === undefined) {
      return NextResponse.json(
        { error: "appUrl, key, and value are required" },
        { status: 400 }
      );
    }

    const envVarManager = await EnvVarManager.create(appUrl);
    await envVarManager.add(key, value);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set env var error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify user authentication
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    const { supabase, user } = result as { supabase: any; user: any };
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const appUrl = searchParams.get('appUrl');
    const key = searchParams.get('key');

    if (!appUrl || !key) {
      return NextResponse.json(
        { error: "appUrl and key are required" },
        { status: 400 }
      );
    }

    const envVarManager = await EnvVarManager.create(appUrl);
    const deleted = await envVarManager.delete(key);

    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error("Delete env var error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 