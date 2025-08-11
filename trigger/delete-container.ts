import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { killDaytonaContainer } from "@/utils/server/daytona";
import { killE2BContainer } from "@/utils/server/e2b";
export const deleteContainer = task({
  id: "delete-container",
  retry: {
    maxAttempts: 1,
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
      switch (sandbox.sandbox_provider) {
        case "daytona":
          await killDaytonaContainer(sandboxId);
          break;
        case "e2b":
          await killE2BContainer(sandboxId);
          break;
      }
    }

    // update status to deleted
    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({ sandbox_status: "deleted" })
      .eq("id", sandbox.id);

    if (updateError) {
      throw new Error(`Failed updating sandbox status: ${updateError.message}`);
    }

    // update user_apps to set current_sandbox_id to null
    const { error: appUpdateError } = await adminSupabase
      .from("user_apps")
      .update({ current_sandbox_id: null })
      .eq("id", appId);

    if (appUpdateError) {
      throw new Error(`Failed updating app sandbox id: ${appUpdateError.message}`);
    }

    await redisUrlSetter(
      appName,
      "https://makex.app/app-not-found",
    );
  },
});
