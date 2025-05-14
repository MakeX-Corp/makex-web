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
    const { appId, appName, containerId, sandboxId, initial } = payload;
    const adminSupabase = await getSupabaseAdmin();


    const { data: updatedSandbox, error: initialUpdateError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        app_status: "starting",
      })
      .eq("id", sandboxId);

    console.log("Updated sandbox with container info:", updatedSandbox);
    if (initialUpdateError) {
      throw new Error(`Failed updating sandbox with container info: ${initialUpdateError.message}`);
    }


    const { appUrl, apiUrl } = await startExpoInContainerE2B(containerId);

    // sleep for 6 seconds
    await new Promise(resolve => setTimeout(resolve, 12000));

    // do a GET request to appPreview to check if it's ready
    const appPreviewResponse = await fetch(appUrl);
    console.log("App preview response:", appPreviewResponse);
    await redisUrlSetter(appName, appUrl, apiUrl);

    // sleep for 6 seconds
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Initialize file backend
    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        api_url: apiUrl,
        app_url: appUrl,
        app_status: "active",
      })
      .eq("id", sandboxId);

    if (updateError) {
      throw new Error(`Failed updating sandbox with container info: ${updateError.message}`);
    }


    if (initial) {
      // Initial Git commit
      const filebackendApiClient = await createFileBackendApiClient(`${apiUrl}`);

      const res = await filebackendApiClient.post("/checkpoint/save", {
        name: "initial",
        message: "Initial commit",
      });

      console.log("Initial commit response:", res);

      // update the app with the current commit 
      const { data: updatedApp, error: updateAppError } = await adminSupabase
        .from("user_apps")
        .update({
          initial_commit: res.commit || res.current_commit,
        })
        .eq("id", appId);

      console.log("Updated app with initial commit:", updatedApp);

      if (updateAppError) {
        throw new Error(`Failed updating app with initial commit: ${updateAppError.message}`);
      }
    }
  },
});
