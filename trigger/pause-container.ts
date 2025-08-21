import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { pauseDaytonaContainer } from "@/utils/server/daytona";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { pauseE2BContainer } from "@/utils/server/e2b";

export const pauseContainer = task({
  id: "pause-container",
  queue: {
    name: "pause-container-queue",
    concurrencyLimit: 1,
  },
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { sandboxId: string; appName: string }) => {
    const { sandboxId, appName } = payload;
    const adminSupabase = await getSupabaseAdmin();

    const { data: sandbox, error: sandboxError } = await adminSupabase
      .from("user_sandboxes")
      .select("*")
      .eq("id", sandboxId)
      .single();

    if (sandboxError) {
      throw new Error(`Failed fetching sandbox: ${sandboxError.message}`);
    }

    const { data: updatedSandbox, error: updatedSandboxError } =
      await adminSupabase
        .from("user_sandboxes")
        .update({
          sandbox_status: "pausing",
        })
        .eq("id", sandbox.id)
        .select()

    if (updatedSandboxError) {
      console.error("Error updating sandbox:", updatedSandboxError.message);
      return;
    }

    if (sandbox) {
      const providerSandboxId = sandbox.sandbox_id;
      if (sandbox) {
        switch (sandbox.sandbox_provider) {
          case "daytona":
            await pauseDaytonaContainer(providerSandboxId);
            break;
          case "e2b":
            await pauseE2BContainer(providerSandboxId);
            break;
        }
      }
    }

    // update status to paused
    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({ sandbox_status: "paused" })
      .eq("id", sandbox.id);

    await redisUrlSetter(
      appName,
      "https://makex.app/app-not-found",
    );

    if (updateError) {
      throw new Error(`Failed updating sandbox status: ${updateError.message}`);
    }
  },
});
