import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { createE2BContainer } from "@/utils/server/e2b";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { redisUrlSetter } from "@/utils/server/redis-client";

export const createContainer = task({
  id: "create-container",
  retry: {
    maxAttempts: 1
  },
  run: async (payload: { userId: string; appId: string; appName: string }) => {
    const { userId, appId, appName } = payload;
    const adminSupabase = await getSupabaseAdmin();

    const { data: newSandbox, error: newSandboxError } = await adminSupabase
      .from("user_sandboxes")
      .insert({
        user_id: userId,
        app_id: appId,
        sandbox_status: "starting",
        sandbox_created_at: new Date().toISOString(),
        sandbox_updated_at: new Date().toISOString(),
      })
      .select()
      .limit(1);

    if (newSandboxError) {
      throw new Error(`Failed inserting new sandbox: ${newSandboxError.message}`);
    }

    const sandboxDbId = newSandbox?.[0]?.id;
    if (!sandboxDbId) {
      throw new Error("Failed to create initial sandbox record (missing ID)");
    }

    const { sbx, appHost, apiHost } = await createE2BContainer({
      userId,
      appId,
      appName,
    });

    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        api_url: apiHost,
        app_url: appHost,
        sandbox_status: "active",
        sandbox_id: sbx.sandboxId,
      })
      .eq("id", sandboxDbId);

    if (updateError) {
      throw new Error(`Failed updating sandbox with container info: ${updateError.message}`);
    }

    await redisUrlSetter(appName, appHost, apiHost);

    // Initialize file backend
    const filebackendApiClient = await createFileBackendApiClient(`https://${apiHost}`);

    // Initial Git commit
    const res = await filebackendApiClient.post("/checkpoint/save", {
      name: "initial",
      message: "Initial commit",
    });

    console.log("Initial commit response:", res);

    // update the app with the current commit 
    const { data: updatedApp, error: updateAppError } = await adminSupabase
      .from("user_apps")
      .update({
        initial_commit: res.commit || res.current_commit,
      })
      .eq("id", appId);

    console.log("Updated app with initial commit:", updatedApp);

    if (updateAppError) {
      throw new Error(`Failed updating app with initial commit: ${updateAppError.message}`);
    }
  },
});
