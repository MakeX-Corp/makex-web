import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { createE2BContainer, resumeE2BContainer } from "@/utils/server/e2b";
import { redisUrlSetter } from "@/utils/server/redis-client";

export const startNewContainer = task({
  id: "manage-sandbox",
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

    const resumeSandbox = async (sandboxDbId: string, sandboxId: string) => {
      await adminSupabase
        .from("user_sandboxes")
        .update({ sandbox_status: "resuming" })
        .eq("id", sandboxDbId);

      const { appHost, apiHost } = await resumeE2BContainer(sandboxId);

      await redisUrlSetter(appName, appHost, apiHost);

      await adminSupabase
        .from("user_sandboxes")
        .update({ sandbox_status: "active" })
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

    // No active sandbox → Create new one
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
  },
});
