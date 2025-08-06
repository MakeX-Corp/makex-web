import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { initiateResumeDaytonaContainer } from "@/utils/server/daytona";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { resumeE2BContainer } from "@/utils/server/e2b";
import { startExpo } from "./start-expo";

export const resumeContainer = task({
  id: "resume-container",
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { userId: string; appId: string; appName: string }) => {
    const { userId, appId, appName } = payload;
    const adminSupabase = await getSupabaseAdmin();

    // Get the app and then fetch the current sandbox
    const { data: app, error: appError } = await adminSupabase
      .from("user_apps")
      .select("current_sandbox_id")
      .eq("user_id", userId)
      .eq("id", appId)
      .single();

    if (appError) {
      throw new Error(`Failed fetching app: ${appError.message}`);
    }

    if (!app?.current_sandbox_id) {
      // Create a new sandbox since the app doesn't have one
      console.log("[resumeContainer] No current sandbox, creating new one");
      
      // Step 1: Create a new user_sandboxes record
      const { data: newSandbox, error: newSandboxError } = await adminSupabase
        .from("user_sandboxes")
        .insert({
          user_id: userId,
          app_id: appId,
          sandbox_status: "starting",
          sandbox_created_at: new Date().toISOString(),
          sandbox_updated_at: new Date().toISOString(),
          sandbox_provider: "e2b",
        })
        .select()
        .single();

      if (newSandboxError) {
        throw new Error(`Failed creating new sandbox: ${newSandboxError.message}`);
      }

      const sandboxDbId = newSandbox.id;

      // Step 2: Create E2B container
      const { createE2BContainer } = await import("@/utils/server/e2b");
      const { appHost, containerId } = await createE2BContainer({
        userId,
        appId,
        appName,
      });

      // Step 3: Update sandbox with container info and set to active
      await adminSupabase
        .from("user_sandboxes")
        .update({
          sandbox_status: "active",
          sandbox_id: containerId,
        })
        .eq("id", sandboxDbId);

      // Step 4: Update app's current_sandbox_id
      await adminSupabase
        .from("user_apps")
        .update({
          current_sandbox_id: sandboxDbId,
        })
        .eq("id", appId);

      // Step 5: Set Redis URL
      await redisUrlSetter(appName, appHost);

      // Step 6: Setup the container (Convex, Git, and Expo)
      const { setupContainer } = await import("./setup-container");
      await setupContainer.trigger({
        appId,
        appName,
        containerId,
        sandboxId: sandboxDbId,
      });

      return;
    }

    // Get the specific current sandbox
    const { data: sandbox, error: sandboxError } = await adminSupabase
      .from("user_sandboxes")
      .select("id, sandbox_id, sandbox_provider, sandbox_status")
      .eq("id", app.current_sandbox_id)
      .single();

    if (sandboxError) {
      throw new Error(`Failed fetching sandbox: ${sandboxError.message}`);
    }

    const sandboxDbId = sandbox.id;
    const sandboxId = sandbox.sandbox_id;

    // Update status to resuming
    await adminSupabase
      .from("user_sandboxes")
      .update({ sandbox_status: "resuming" })
      .eq("id", sandboxDbId);

    // Resume based on provider
    switch (sandbox.sandbox_provider) {
      case "daytona":
        await initiateResumeDaytonaContainer(sandboxId);
        await startExpo.trigger({
          appId: appId,
          appName: appName,
          containerId: sandboxId,
          sandboxId: sandboxDbId,
        });
        break;
      case "e2b":
        const { appHost } = await resumeE2BContainer(sandboxId);
        await redisUrlSetter(appName, `${appHost}`);
        break;
    }

  
    // Update status to active
    const { data: updatedSandbox, error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        sandbox_status: "active",
      })
      .eq("id", sandboxDbId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update sandbox status: ${updateError.message}`);
    }

    console.log("Updated sandbox:", updatedSandbox);
  },
});
