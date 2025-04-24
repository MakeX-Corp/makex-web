import { NextResponse } from "next/server";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { createE2BContainer, resumeE2BContainer, pauseE2BContainer } from "@/utils/server/e2b";
import { UserSandbox } from "@/types/sandbox";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await getSupabaseWithUser(req);

    if (result instanceof NextResponse) return result;

    const { supabase, user } = result;
    const { appId, appName } = body;

    console.log("User ID:", user.id);
    console.log("App ID:", appId);

    console.log("App Deets In POST", appName, appId);

    const adminSupabase = await getSupabaseAdmin();

    const { data: activeSandbox, error: activeSandboxError } =
      await adminSupabase
        .from("user_sandboxes")
        .select("*")
        .eq("user_id", user.id)
        .eq("app_id", appId)
        .in("sandbox_status", ["active", "starting", "paused", "resuming", "pausing"])

    console.log("Active sandbox:", activeSandbox);
    const resumeSandbox = async (sandboxDbId: string, sandboxId: string) => {

      console.log("Resuming sandbox with id", sandboxId);
      const { data: updatedSandbox, error: updatedSandboxError } =
        await adminSupabase
          .from("user_sandboxes")
          .update({
            sandbox_status: "resuming",
          })
          .eq("id", sandboxDbId)
          .select()
          .overrideTypes<UserSandbox[]>();

      if (updatedSandboxError) {
        console.error("Error updating sandbox:", updatedSandboxError);
        return NextResponse.json(
          { error: updatedSandboxError.message },
          { status: 500 }
        );
      }

      const { appHost, apiHost } = await resumeE2BContainer(sandboxId);

      await redisUrlSetter(appName, appHost, apiHost);

      const { data: updatedSandbox2, error: updatedSandbox2Error } =
        await adminSupabase
          .from("user_sandboxes")
          .update({
            sandbox_status: "active",
          })
          .eq("id", sandboxDbId)
          .select()
          .overrideTypes<UserSandbox[]>();

      if (updatedSandbox2Error) {
        console.error("Error updating sandbox:", updatedSandbox2Error);
        return NextResponse.json(
          { error: updatedSandbox2Error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: "Sandbox resumed successfully" },
        { status: 201 }
      );
    }

    if (activeSandbox && activeSandbox.length > 0) {
      const sandboxStatus = activeSandbox[0].sandbox_status;
      const sandboxId = activeSandbox[0].sandbox_id;
      const sandboxDbId = activeSandbox[0].id;
      switch (sandboxStatus) {
        case "active":
          return NextResponse.json(
            { error: "Active sandbox already exists" },
            { status: 200 }
          );
        case "starting":
          return NextResponse.json(
            { error: "Sandbox starting" },
            { status: 400 }
          );
        case "resuming":
          return NextResponse.json(
            { error: "Sandbox resuming" },
            { status: 400 }
          );
        case "paused":
          return resumeSandbox(sandboxDbId, sandboxId);
        case "pausing":
          //sleep 10 seconds 
          await new Promise(resolve => setTimeout(resolve, 10000));
          // resume it 
          return resumeSandbox(sandboxDbId, sandboxId);
      }
    }



    console.log("Creating new sandbox");
    // creating a new sandbox first thing you do is write it to db even before you start the container so that we cab track it
    const { data: newSandbox, error: newSandboxError } = await adminSupabase
      .from("user_sandboxes")
      .insert({
        user_id: user.id,
        app_id: appId,
        sandbox_status: "starting",
        sandbox_created_at: new Date().toISOString(),
        sandbox_updated_at: new Date().toISOString(),
      })
      .select()
      .limit(1)
      .overrideTypes<UserSandbox[]>();

    if (newSandboxError) {
      console.error("Error creating new sandbox:", newSandboxError);
      return NextResponse.json(
        { error: newSandboxError.message },
        { status: 500 }
      );
    }

    const sandboxId = newSandbox?.[0]?.id;
    console.log("Sandbox Id", sandboxId);

    if (sandboxId) {
      // now you start the container actually
      const { sbx, appHost, apiHost } = await createE2BContainer({
        userId: user.id,
        appId: appId,
        appName: appName,
      });

      // now you update the sandbox with the container id
      const { data: updatedSandbox, error: updatedSandboxError } =
        await adminSupabase
          .from("user_sandboxes")
          .update({
            api_url: apiHost,
            app_url: appHost,
            sandbox_status: "active",
            sandbox_id: sbx.sandboxId,
          })
          .eq("id", sandboxId)
          .select()
          .overrideTypes<UserSandbox[]>();

      await redisUrlSetter(appName, appHost, apiHost);

      if (updatedSandboxError) {
        return NextResponse.json(
          { error: updatedSandboxError.message },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({
      message: "Sandbox created successfully",
    }, {
      status: 201,
    });
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
