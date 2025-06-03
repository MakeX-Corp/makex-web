import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { startExpoInContainer } from "@/utils/server/daytona";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { startExpoInContainer as startExpoInContainerE2B } from "@/utils/server/e2b";

export const startExpo = task({
  id: "start-expo",
  retry: {
    maxAttempts: 1
  },
  run: async (payload: { appId: string; appName: string; containerId: string; sandboxId: string, initial: boolean }) => {
    console.log("[startExpo] Starting trigger with payload:", payload);
    const { appId, appName, containerId, sandboxId, initial } = payload;
    const adminSupabase = await getSupabaseAdmin();

    console.log("[startExpo] Updating sandbox status to starting");
    const { data: updatedSandbox, error: initialUpdateError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        app_status: "starting",
      })
      .eq("id", sandboxId);

    console.log("[startExpo] Updated sandbox with container info:", updatedSandbox);
    if (initialUpdateError) {
      console.error("[startExpo] Error updating sandbox:", initialUpdateError);
      throw new Error(`Failed updating sandbox with container info: ${initialUpdateError.message}`);
    }

    console.log("[startExpo] Starting Expo in container:", containerId);
    try {
      const { appUrl, apiUrl } = await startExpoInContainerE2B(containerId);
      console.log("[startExpo] Expo started successfully. App URL:", appUrl, "API URL:", apiUrl);

      await new Promise(resolve => setTimeout(resolve, 6000));

      // do a GET request to appPreview to check if it's ready
      console.log("[startExpo] Checking app preview availability");
      const appPreviewResponse = await fetch(appUrl);
      console.log("[startExpo] App preview response:", appPreviewResponse);
      await redisUrlSetter(appName, appUrl, apiUrl);

      console.log("[startExpo] Updating sandbox with URLs");
      const { error: updateError } = await adminSupabase
        .from("user_sandboxes")
        .update({
          api_url: apiUrl,
          app_url: appUrl,
          app_status: "rendering",
        })
        .eq("id", sandboxId);

      if (updateError) {
        console.error("[startExpo] Error updating sandbox with URLs:", updateError);
        throw new Error(`Failed updating sandbox with container info: ${updateError.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 6000));

      console.log("[startExpo] Updating sandbox status to loading");
      const { error: updateError2 } = await adminSupabase
        .from("user_sandboxes")
        .update({
          api_url: apiUrl,
          app_url: appUrl,
          app_status: "loading",
        })
        .eq("id", sandboxId);

      if (updateError2) {
        console.error("[startExpo] Error updating sandbox status to loading:", updateError2);
        throw new Error(`Failed updating sandbox with container info: ${updateError2.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 6000));

      console.log("[startExpo] Updating sandbox status to bundling");
      const { error: updateError3 } = await adminSupabase
        .from("user_sandboxes")
        .update({
          api_url: apiUrl,
          app_url: appUrl,
          app_status: "bundling",
        })
        .eq("id", sandboxId);

      if (updateError3) {
        console.error("[startExpo] Error updating sandbox status to bundling:", updateError3);
        throw new Error(`Failed updating sandbox with container info: ${updateError3.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 6000));

      console.log("[startExpo] Final sandbox status update");
      const { error: updateError4 } = await adminSupabase
        .from("user_sandboxes")
        .update({
          api_url: apiUrl,
          app_url: appUrl,
        })
        .eq("id", sandboxId);

      if (updateError4) {
        console.error("[startExpo] Error in final sandbox update:", updateError4);
        throw new Error(`Failed updating sandbox with container info: ${updateError4.message}`);
      }

      if (initial) {
        console.log("[startExpo] Creating initial commit");
        // Initial Git commit
        const filebackendApiClient = await createFileBackendApiClient(`${apiUrl}`);

        const res = await filebackendApiClient.post("/checkpoint/save", {
          name: "initial",
          message: "Initial commit",
        });

        console.log("[startExpo] Initial commit response:", res);

        // update the app with the current commit 
        const { data: updatedApp, error: updateAppError } = await adminSupabase
          .from("user_apps")
          .update({
            initial_commit: res.commit || res.current_commit,
          })
          .eq("id", appId);

        console.log("[startExpo] Updated app with initial commit:", updatedApp);

        if (updateAppError) {
          console.error("[startExpo] Error updating app with initial commit:", updateAppError);
          throw new Error(`Failed updating app with initial commit: ${updateAppError.message}`);
        }

        // Update app configuration
        console.log("[startExpo] Updating app configuration");
        const appConfigResponse = await filebackendApiClient.post("/app-config", {
          name: appName,
          slug: appName.toLowerCase().replace(/\s+/g, '-'),
        });

        console.log("[startExpo] App configuration updated successfully:", appConfigResponse);
      }
    } catch (error) {
      console.error("[startExpo] Error in trigger execution:", error);
      throw error;
    }
  },
});
