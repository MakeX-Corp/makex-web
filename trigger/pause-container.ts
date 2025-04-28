import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { pauseE2BContainer } from "@/utils/server/e2b";
import { redisUrlSetter } from "@/utils/server/redis-client";

export const pauseContainer = task({
  id: "pause-container",
  retry: {
    maxAttempts: 1
  },
  run: async (payload: { userId: string; appId: string; appName: string }) => {
    const { userId, appId, appName } = payload;
    const adminSupabase = await getSupabaseAdmin();

    const { data: sandbox, error: sandboxError } = await adminSupabase
      .from("user_sandboxes")
      .select("*")
      .eq("user_id", userId)
      .eq("app_id", appId)
      .single();

    if (sandboxError) {
      throw new Error(`Failed fetching sandbox: ${sandboxError.message}`);
    }

    if (sandbox) {
      const sandboxId = sandbox.sandbox_id;
      await pauseE2BContainer(sandboxId);
    }

    // update status to deleted 
    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({ sandbox_status: "paused" })
      .eq("id", sandbox.id);

    await redisUrlSetter(appName, "https://makex.app/app-not-found", "https://makex.app/app-not-found");

    if (updateError) {
      throw new Error(`Failed updating sandbox status: ${updateError.message}`);
    }
  },
});
