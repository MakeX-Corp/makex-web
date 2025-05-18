import { task } from "@trigger.dev/sdk/v3";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { dub } from "@/utils/server/dub";

export const deployEAS = task({
  id: "deploy-eas",
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: {
    appId: string;
  }) => {
    const { appId } = payload;
    const supabase = await getSupabaseAdmin();

    // Get app information including api_url
    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("api_url,user_id")
      .eq("id", appId)
      .single();

    if (appError || !app) {
      throw new Error("No app found");
    }

    const fileClient = createFileBackendApiClient(app.api_url);

    // Create deployment record
    const { data: deployment, error: createError } = await supabase
      .from("user_deployments")
      .insert({
        app_id: appId,
        user_id: app.user_id,
        type: "eas-update",
        status: "uploading",
      })
      .select()
      .single();

    if (createError || !deployment) {
      throw new Error(createError?.message || "Failed to create deployment record");
    }

    try {
      const response = await fileClient.post("/deploy-eas", {
        token: process.env.EXPO_ACCESS_TOKEN,
        message: "Update",
      });

      console.log(response);

      const url = `makex://u.expo.dev/${response.project_id}/group/${response.group_id}`;

      const link = await dub.links.create({
        url: url,
        proxy: true,
        domain: "makexapp.link",
        title: "MakeX App",
        image: "/logo.png",
        description: "MakeX App",
      });

      console.log(link);

      // Update deployment with success status and metadata
      await supabase
        .from("user_deployments")
        .update({
          status: "completed",
          metadata: response,
          url: url,
        })
        .eq("id", deployment.id);

      return response.data;
    } catch (error) {
      // Update deployment with failed status and error
      await supabase
        .from("user_deployments")
        .update({
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        })
        .eq("id", deployment.id);

      throw error;
    }
  },
});
