import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { startExpoInContainer } from "@/utils/server/daytona";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { AArrowDown } from "lucide-react";

export const startExpo = task({
  id: "start-expo",
  retry: {
    maxAttempts: 1
  },
  run: async (payload: { userId: string; appId: string; appName: string; containerId: string; sandboxId: string }) => {
    const { userId, appId, appName, containerId, sandboxId } = payload;
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


    const { apiPreview, appPreview } = await startExpoInContainer(containerId);

    // sleep for 6 seconds
    await new Promise(resolve => setTimeout(resolve, 6000));

    // do a GET request to appPreview to check if it's ready
    const appPreviewResponse = await fetch(appPreview);
    console.log("App preview response:", appPreviewResponse);
    await redisUrlSetter(appName, appPreview, apiPreview);
    // Initialize file backend
    const filebackendApiClient = await createFileBackendApiClient(`${apiPreview}`);

    // Initial Git commit
    const res = await filebackendApiClient.post("/checkpoint/save", {
      name: "initial",
      message: "Initial commit",
    });

    console.log("Initial commit response:", res);

    const { error: updateError } = await adminSupabase
      .from("user_sandboxes")
      .update({
        api_url: apiPreview,
        app_url: appPreview,
        app_status: "active",
      })
      .eq("id", sandboxId);

    if (updateError) {
      throw new Error(`Failed updating sandbox with container info: ${updateError.message}`);
    }

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
  },
});
