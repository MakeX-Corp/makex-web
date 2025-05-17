import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(req: Request) {
  const { apiUrl, appId } = await req.json();
  const result = await getSupabaseWithUser(req as NextRequest);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;
  const { supabase, user } = result;
  // Create the deployment record
  const { data: deploymentRecord } = await supabase
    .from("user_deployments")
    .insert({
      app_id: appId,
      user_id: user.id,
      status: "uploading",
    })
    .select()
    .single();

  const deploymentId = deploymentRecord.id;

  const taskResult = await tasks.triggerAndPoll(
    "deploy-web",
    {
      userId: user.id,
      apiUrl,
      appId,
      deploymentId,
    },
    {
      pollIntervalMs: 3000,
    }
  );
  // If job finished within timeout
  if (taskResult.status === "COMPLETED") {
    return NextResponse.json({
      success: true,
      deploymentId,
      deploymentUrl: taskResult.output?.deploymentUrl,
    });
  }
  return NextResponse.json({
    success: true,
    deploymentId,
    message: "Deployment started in background",
  });
}
