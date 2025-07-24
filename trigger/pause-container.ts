import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { pauseDaytonaContainer } from "@/utils/server/daytona";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { pauseE2BContainer } from "@/utils/server/e2b";
import { UserSandbox } from "@/types/sandbox";

export const pauseContainer = task({
  id: "pause-container",
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { appId: string; appName: string }) => {
    const { appId, appName } = payload;
    const adminSupabase = await getSupabaseAdmin();

    const { data: sandbox, error: sandboxError } = await adminSupabase
      .from("user_sandboxes")
      .select("*")
      .eq("app_id", appId)
      .single();

    const { data: updatedSandbox, error: updatedSandboxError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        sandbox_status: "pausing",
        app_status: "pausing",
      })
      .eq("id", sandbox.id)
      .select()
      .overrideTypes<UserSandbox[]>();

    if (updatedSandboxError) {
      console.error("Error updating sandbox:", updatedSandboxError.message);
      return;
    }

    if (sandboxError) {
      throw new Error(`Failed fetching sandbox: ${sandboxError.message}`);
    }

    if (sandbox) {
      const sandboxId = sandbox.sandbox_id;
      if (sandbox) {
        const sandboxId = sandbox.sandbox_id;
        switch (sandbox.sandbox_provider) {
          case "daytona":
            await pauseDaytonaContainer(sandboxId);
            break;
          case "e2b":
            await pauseE2BContainer(sandboxId);
            break;
        }
      }
    }

    // update status to paused
    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({ sandbox_status: "paused", app_status: "paused" })
      .eq("id", sandbox.id);

    await redisUrlSetter(
      appName,
      "https://makex.app/app-not-found",
      "https://makex.app/app-not-found"
    );

    if (updateError) {
      throw new Error(`Failed updating sandbox status: ${updateError.message}`);
    }
  },
});
