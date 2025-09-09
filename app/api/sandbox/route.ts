import { resumeContainer } from "@/trigger/resume-container";
import { pauseContainer } from "@/trigger/pause-container";
import { deleteContainer } from "@/trigger/delete-container";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: Request) {
  try {
    const result = await getSupabaseWithUser(req as NextRequest);

    if (result instanceof NextResponse || "error" in result) return result;

    const { supabase, user } = result;

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");

    // Get app and its current sandbox in one query
    const { data: app, error } = await supabase
      .from("user_apps")
      .select(
        `
        current_sandbox_id,
        coding_status,
        user_sandboxes!current_sandbox_id(sandbox_status, expo_status)
      `,
      )
      .eq("id", appId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!app || !app.current_sandbox_id || !app.user_sandboxes) {
      return NextResponse.json(
        { message: "No current sandbox found for this app" },
        { status: 404 },
      );
    }

    // Flatten the data to send just the statuses
    const sandbox = app.user_sandboxes as any;
    const flattenedData = {
      coding_status: app.coding_status,
      sandbox_status: sandbox.sandbox_status,
      expo_status: sandbox.expo_status,
    };

    return NextResponse.json(flattenedData);
  } catch (err: any) {
    console.error("Error fetching sandbox:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const result = await getSupabaseWithUser(req as NextRequest);

    if (result instanceof NextResponse || "error" in result) return result;

    const { user } = result;
    const { appId, appName } = await req.json();

    await deleteContainer.trigger({
      userId: user.id,
      appId,
      appName,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const result = await getSupabaseWithUser(req as NextRequest);

    if (result instanceof NextResponse || "error" in result) return result;

    const { user, supabase } = result;

    const { appId, targetState } = await req.json();

    // get app details
    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("*")
      .eq("id", appId)
      .single();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    // get the sandbox details
    const { data: sandbox, error: sandboxError } = await supabase
      .from("user_sandboxes")
      .select("*")
      .eq("app_id", appId)
      .single();

    if (sandboxError) {
      return NextResponse.json(
        { error: sandboxError.message },
        { status: 500 },
      );
    }

    if (
      sandbox.sandbox_status == "active" ||
      sandbox.sandbox_status == "starting"
    ) {
      return NextResponse.json(
        { error: "App is active, cannot change state" },
        { status: 200 },
      );
    }

    if (targetState == "resume") {
      await resumeContainer.trigger({
        userId: user.id,
        appId,
        appName: app.app_name,
      });
    }

    if (targetState == "pause") {
      await pauseContainer.trigger({
        sandboxId: sandbox.id,
        appName: app.app_name,
      });
    }

    return NextResponse.json(
      { message: "Sandbox management started in background" },
      { status: 202 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
