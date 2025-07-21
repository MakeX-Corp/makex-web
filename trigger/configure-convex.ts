import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { createConvexProject } from "@/utils/server/convex";
import {
  writeConvexConfigInContainer,
  startConvexInContainer,
} from "@/utils/server/e2b";

export const configureConvex = task({
  id: "configure-convex",
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { appId: string; containerId: string }) => {
    console.log("[configureConvex] Starting trigger with payload:", payload);
    const { appId, containerId } = payload;
    const adminSupabase = await getSupabaseAdmin();

    console.log("[configureConvex] Creating Convex project");
    let convex;
    try {
      convex = await createConvexProject({
        projectName: `makex-${appId}`,
        teamSlug: process.env.CONVEX_TEAM_SLUG!,
      });
      console.log("[configureConvex] Convex project created:", convex);
    } catch (convexError) {
      console.error(
        "[configureConvex] Failed to create Convex project:",
        convexError
      );

      await adminSupabase
        .from("user_apps")
        .update({
          convex_prod_url: null,
          convex_admin_key: null,
          convex_project_id: null,
        })
        .eq("id", appId);

      throw new Error("Aborting: Failed to create Convex project");
    }

    const deploymentName = convex.deploymentName;
    const devUrl = convex.prodUrl; //very confusing, but this is correct since we are using "dev" deployment
    const devAdminKey = convex.adminKey;
    const projectId = convex.projectId;
    console.log(
      "[configureConvex] Updating app with Convex info",
      devUrl,
      deploymentName
    );
    const { error: updateError } = await adminSupabase
      .from("user_apps")
      .update({
        convex_dev_url: devUrl,
        convex_project_id: projectId,
        convex_dev_admin_key: devAdminKey,
      })
      .eq("id", appId);

    if (updateError) {
      console.error(
        "[configureConvex] Error updating app with convex info:",
        updateError
      );
      throw new Error(
        `Failed updating app with convex info: ${updateError.message}`
      );
    }

    console.log("[configureConvex] Writing Convex config in container");
    try {
      // Write Convex config
      const writeConvexConfigResponse = await writeConvexConfigInContainer(
        containerId,
        {
          deploymentName,
          convexUrl: devUrl,
        }
      );
      console.log(
        "[configureConvex] Convex config + env written in container:",
        writeConvexConfigResponse
      );

      // Only start Convex if write succeeded
      const startConvexResponse = await startConvexInContainer(containerId);
      console.log(
        "[configureConvex] Convex started in container:",
        startConvexResponse
      );
    } catch (writeError) {
      console.error(
        "[configureConvex] Error writing convex config or env file:",
        writeError
      );
      throw new Error("Aborting: Failed to write convex config or env file");
    }

    console.log(
      "[configureConvex] Convex configuration completed successfully"
    );
  },
});
