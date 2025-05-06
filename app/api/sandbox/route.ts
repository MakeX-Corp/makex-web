import { resumeContainer } from "@/trigger/resume-container";
import { pauseContainer } from "@/trigger/pause-container"
import { deleteContainer } from "@/trigger/delete-container";
import { createContainer } from "@/trigger/create-container";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse, NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await getSupabaseWithUser(req as NextRequest);

    if (result instanceof NextResponse || 'error' in result ) return result;

    const { user } = result;
    const { appId, appName, targetState } = body;

    // start new container 
    await createContainer.trigger({
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
    const result = await getSupabaseWithUser(req as NextRequest);

    if (result instanceof NextResponse || 'error' in result ) return result;

    const { supabase, user } = result;

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");

    console.log("GET SANDBOX ROUTE HIT")
    console.log("User ID:", user.id);
    console.log("App ID:", appId);

    const adminSupabase = await getSupabaseAdmin();

    const { data, error } = await supabase
      .from('user_sandboxes')
      .select('sandbox_id, sandbox_status, sandbox_updated_at')
      .eq('app_id', appId)
      .order('sandbox_updated_at', { ascending: false })
      .limit(1);

    console.log("Data:", data);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "No active sandbox found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (err: any) {
    console.error("Error fetching sandbox:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}


export async function DELETE(req: Request) {
  try {
    const result = await getSupabaseWithUser(req as NextRequest);

    if (result instanceof NextResponse || 'error' in result ) return result;

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
      { status: 500 }
    );
  }
}


export async function PATCH(req: Request) {
  
  try {
    const result = await getSupabaseWithUser(req as NextRequest);

    if (result instanceof NextResponse || 'error' in result ) return result;

    const { user } = result;
    
    const { appId, appName, targetState } = await req.json();

    if (targetState == 'resume') {
      await resumeContainer.trigger({
        userId: user.id,
        appId,
        appName,
      });
    }

    if (targetState == 'pause') {
      await pauseContainer.trigger({
        userId: user.id,
        appId,
        appName,
      });
    }

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


