import { task } from "@trigger.dev/sdk/v3";
import {
  createE2BContainer,
  deployConvexProdInContainer,
  killE2BContainer,
} from "@/utils/server/e2b";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export const deployConvex = task({
  id: "deploy-convex",
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { appId: string }) => {
    console.log("[deployConvex] Starting trigger with payload:", payload);
    const { appId } = payload;
    const supabase = await getSupabaseAdmin();
    let containerId: string | undefined;

    try {
      // Get app record to fetch git_repo_id and convex_dev_url
      console.log("[deployConvex] Fetching app record for appId:", appId);
      const { data: appRecord, error: appError } = await supabase
        .from("user_apps")
        .select("git_repo_id, convex_dev_url")
        .eq("id", appId)
        .single();

      if (appError || !appRecord) {
        throw new Error("App record not found");
      }

      const { git_repo_id, convex_dev_url } = appRecord;

      if (!git_repo_id) {
        throw new Error("Git repository ID not found for this app");
      }

      if (!convex_dev_url) {
        throw new Error("Convex dev URL not found for this app");
      }

      console.log(
        "[deployConvex] Found app record - gitRepoId:",
        git_repo_id,
        "convexDevUrl:",
        convex_dev_url
      );

      console.log("[deployConvex] Creating E2B container for Convex deployment...");

      const containerResult = await createE2BContainer({
        userId: "convex-container",
        appId: "convex-container",
        appName: "convex-container",
      });
      containerId = containerResult.containerId;

      console.log("[deployConvex] E2B container created:", containerId);

      // Deploy Convex prod in the container
      console.log("[deployConvex] Deploying Convex prod in container...");
      const deployResult = await deployConvexProdInContainer(
        containerId,
        convex_dev_url,
        git_repo_id
      );

      console.log("[deployConvex] Convex prod deployment initiated successfully");

      // Kill the container
      console.log("[deployConvex] Killing the container...");
      await killE2BContainer(containerId);

      console.log("[deployConvex] Convex deployment completed successfully");
      return {
        status: "success",
        containerId: containerId,
        appId: appId,
        gitRepoId: git_repo_id,
        convexDevUrl: convex_dev_url,
      };
    } catch (error: any) {
      console.error("[deployConvex] Failed to deploy Convex in container:", error.message);

      // Kill the container if it was created
      if (containerId) {
        console.log("[deployConvex] Killing the container due to failure...");
        try {
          await killE2BContainer(containerId);
        } catch (killError: any) {
          console.error("[deployConvex] Failed to kill container:", killError.message);
        }
      }

      throw new Error(`Failed to deploy Convex in container: ${error.message || "Unknown error"}`);
    }
  },
});
