import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { createE2BContainerClaude } from "@/utils/server/e2b";
import { redisUrlSetter } from "@/utils/server/redis-client";

export const createContainer = task({
  id: "create-container-claude",
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

    const { sbx, appHost, apiHost } = await createE2BContainerClaude({
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

    return {
      success: true,
      appId,
      appName,
      apiHost,
      appHost,
    };
  },
});
