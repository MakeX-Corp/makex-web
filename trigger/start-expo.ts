import { task } from "@trigger.dev/sdk";
import { setupQueue } from "./setup-queue";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { startExpoInContainer as startExpoInContainerE2B } from "@/utils/server/e2b";

export const startExpo = task({
  id: "start-expo",
  queue: setupQueue,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: {
    appId: string;
    appName: string;
    containerId: string;
    sandboxId: string;
  }) => {
    console.log("[startExpo] Starting trigger with payload:", payload);
    const { appId, appName, containerId, sandboxId } = payload;
    const adminSupabase = await getSupabaseAdmin();

    console.log("[startExpo] Starting Expo in container:", containerId);
    try {
      // Set status to 'starting' at the very beginning
      const { error: startingError } = await adminSupabase
        .from("user_sandboxes")
        .update({ expo_status: "starting" })
        .eq("id", sandboxId);
      if (startingError) {
        console.error(
          "[startExpo] Error setting expo_status to 'starting':",
          startingError,
        );
        throw new Error(
          `Failed setting expo_status to 'starting': ${startingError.message}`,
        );
      }

      const { appUrl } = await startExpoInContainerE2B(containerId);
      console.log("[startExpo] Expo started successfully. App URL:", appUrl);

      // Set status to 'bundling' after Expo is started
      const { error: bundlingError } = await adminSupabase
        .from("user_sandboxes")
        .update({ expo_status: "bundling" })
        .eq("id", sandboxId);
      if (bundlingError) {
        console.error(
          "[startExpo] Error setting expo_status to 'bundling':",
          bundlingError,
        );
        throw new Error(
          `Failed setting expo_status to 'bundling': ${bundlingError.message}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 12000));

      // Keep curling until success
      const maxAttempts = 20;
      const delayMs = 3000;
      let attempt = 0;
      let appPreviewResponse: Response | null = null;
      while (attempt < maxAttempts) {
        attempt++;
        try {
          console.log(
            `[startExpo] Checking app preview availability, attempt ${attempt}`,
          );
          appPreviewResponse = await fetch(appUrl);
          if (appPreviewResponse.ok) {
            console.log("[startExpo] App preview is available.");
            break;
          } else {
            console.log(
              `[startExpo] App preview not ready, status: ${appPreviewResponse.status}`,
            );
          }
        } catch (err) {
          console.log(`[startExpo] Error fetching app preview: ${err}`);
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (!appPreviewResponse || !appPreviewResponse.ok) {
        throw new Error(
          "App preview never became available after multiple attempts.",
        );
      }
      await redisUrlSetter(appName, appUrl);

      // Set status to 'ready' at the end
      console.log(
        "[startExpo] Updating sandbox with URLs and setting status to ready",
      );
      const { error: updateError } = await adminSupabase
        .from("user_sandboxes")
        .update({
          app_url: appUrl,
          expo_status: "bundled",
        })
        .eq("id", sandboxId);

      if (updateError) {
        console.error(
          "[startExpo] Error updating sandbox with URLs and ready status:",
          updateError,
        );
        throw new Error(
          `Failed updating sandbox with container info: ${updateError.message}`,
        );
      }
    } catch (error) {
      console.error("[startExpo] Error in trigger execution:", error);
      throw error;
    }
  },
});
