import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { initiateDaytonaContainer } from "@/utils/server/daytona";
import { startExpo } from "./start-expo";
import { redisUrlSetter } from "@/utils/server/redis-client";

export const containerInitiate = task({
  id: "container-initiate",
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
        sandbox_provider: "daytona",
        app_status: "starting",
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

    const { containerId, apiUrl } = await initiateDaytonaContainer();

    console.log('containerId', containerId)

    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        sandbox_status: "active",
        sandbox_id: containerId,
        api_url: apiUrl,
      })
      .eq("id", sandboxDbId);

    await redisUrlSetter(appName, 'https://www.makex.app/app-not-found', apiUrl);

    if (updateError) {
      throw new Error(`Failed updating sandbox with container info: ${updateError.message}`);
    }

    await startExpo.trigger({
      userId,
      appId,
      appName,
      containerId,
    });

  },
});
