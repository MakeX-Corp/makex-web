import { startNewContainer } from "@/trigger/start-new-container";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await getSupabaseWithUser(req);

    if (result instanceof NextResponse) return result;

    const { user } = result;
    const { appId, appName } = body;

    await startNewContainer.trigger({
      userId: user.id,
      appId,
      appName,
    });

    return NextResponse.json(
      { message: "Sandbox management started in background" },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}



export async function GET(req: Request) {
  try {
    const result = await getSupabaseWithUser(req);

    if (result instanceof NextResponse) return result;

    const { supabase, user } = result;

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");

    console.log("GET SANDBOX ROUTE HIT")
    console.log("User ID:", user.id);
    console.log("App ID:", appId);

    const adminSupabase = await getSupabaseAdmin();

    const { data: sandboxes, error: sandboxError } =
      await adminSupabase
        .from("user_sandboxes")
        .select("*")
        .eq("user_id", user.id)
        .eq("app_id", appId)
        .in("sandbox_status", ["active", "starting", "resuming"])
        .order("sandbox_created_at", { ascending: false })
        .limit(1);

    console.log("Fetched sandbox:", sandboxes);
    const sandbox = sandboxes && sandboxes.length > 0 ? sandboxes[0] : null;

    if (sandboxError) {
      return NextResponse.json(
        { error: sandboxError.message },
        { status: 500 }
      );
    }

    if (sandbox) {
      return NextResponse.json(
        { sandbox },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "No active sandbox found" },
        { status: 404 }
      );
    }
  } catch (err: any) {
    console.error("Error fetching sandbox:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
