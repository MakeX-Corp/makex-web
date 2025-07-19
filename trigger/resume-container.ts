import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { initiateResumeDaytonaContainer } from "@/utils/server/daytona";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { resumeE2BContainer } from "@/utils/server/e2b";
import { startExpo } from "./start-expo";
export const resumeContainer = task({
  id: "resume-container",
  retry: {
    maxAttempts: 1
  },
  run: async (payload: { userId: string; appId: string; appName: string }) => {
    const { userId, appId, appName } = payload;
    const adminSupabase = await getSupabaseAdmin();

    const { data: activeSandbox, error: activeSandboxError } = await adminSupabase
      .from("user_sandboxes")
      .select("*")
      .eq("user_id", userId)
      .eq("app_id", appId)
      .in("sandbox_status", ["active", "starting", "paused", "resuming", "pausing"]);

    if (activeSandboxError) {
      throw new Error(`Failed fetching active sandboxes: ${activeSandboxError.message}`);
    }

    if (activeSandbox[0]?.sandbox_status === "temporary" || activeSandbox[0]?.sandbox_status === "starting" || activeSandbox[0]?.sandbox_status === "resuming" || activeSandbox[0]?.sandbox_status === "active") {
      return;
    }

    const resumeSandbox = async (sandboxDbId: string, sandboxId: string) => {
      await adminSupabase
        .from("user_sandboxes")
        .update({ sandbox_status: "resuming" })
        .eq("id", sandboxDbId);

        

      switch (activeSandbox[0]?.sandbox_provider) {
        case "daytona":
          const daytonaContainer = await initiateResumeDaytonaContainer(sandboxId);
          await startExpo.trigger(
            {
              appId: appId,
              appName: appName,
              containerId: sandboxId,
              sandboxId: sandboxDbId,
              initial: false,
            }
          );
          break;
        case "e2b":
          const { appHost, apiHost } = await resumeE2BContainer(sandboxId);
          await redisUrlSetter(appName, `${appHost}`, `${apiHost}`);
          break;
      }

      // sleep for 5 seconds
      await adminSupabase
        .from("user_sandboxes")
        .update({ 
          sandbox_status: "active",
          app_status: "active"
        })
        .eq("id", sandboxDbId);
    };


    if (activeSandbox && activeSandbox.length > 0) {
      const sandboxStatus = activeSandbox[0].sandbox_status;
      const sandboxId = activeSandbox[0].sandbox_id;
      const sandboxDbId = activeSandbox[0].id;

      switch (sandboxStatus) {
        case "active":
        case "starting":
        case "resuming":
          return;
        case "paused":
          await resumeSandbox(sandboxDbId, sandboxId);
          return;
        case "pausing":
          await new Promise((r) => setTimeout(r, 10000));
          await resumeSandbox(sandboxDbId, sandboxId);
          return;
      }
    }
  },
});
