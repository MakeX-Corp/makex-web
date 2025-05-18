import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { tasks } from "@trigger.dev/sdk/v3";
import { deployEAS } from "@/trigger/deploy-eas";

export async function POST(req: Request) {
  const { apiUrl, appId, type = "web" } = await req.json();
  const result = await getSupabaseWithUser(req as NextRequest);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;
  const { supabase, user } = result;

  if (type === "mobile") {
    tasks.trigger("deploy-eas", {
      appId,
    });
    return NextResponse.json({
      success: true,
      message: "Mobile deployment started in background",
    });
  } else {
    // Create the deployment record for web deployments
    const { data: deploymentRecord, error: deploymentError } = await supabase
      .from("user_deployments")
      .insert({
        app_id: appId,
        user_id: user.id,
        status: "uploading",
        type,
      })
      .select()
      .single();

    if (deploymentError) {
      console.error("Error creating deployment record:", deploymentError);
      return NextResponse.json(
        { error: deploymentError.message },
        { status: 500 }
      );
    }

    const deploymentId = deploymentRecord.id;

    tasks.trigger("deploy-web", {
      userId: user.id,
      apiUrl,
      appId,
      deploymentId,
    });

    return NextResponse.json({
      success: true,
      deploymentId,
      message: "Web deployment started in background",
    });
  }
}

export async function GET(req: NextRequest) {
  // Get appId from query parameters
  const url = new URL(req.url);
  const appId = url.searchParams.get("appId");

  if (!appId) {
    return NextResponse.json(
      { error: "Missing appId parameter" },
      { status: 400 }
    );
  }

  // Authenticate the user
  const result = await getSupabaseWithUser(req);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;
  const { supabase, user } = result;

  // Fetch the latest deployment for this app by this user
  const { data: deployment, error } = await supabase
    .from("user_deployments")
    .select("*")
    .eq("app_id", appId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No deployments found (single() returns error when no rows)
      return NextResponse.json(null);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the deployment data
  return NextResponse.json(deployment);
}
