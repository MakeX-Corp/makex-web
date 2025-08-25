import { task } from "@trigger.dev/sdk";
import { configureConvex } from "./configure-convex";
import { startExpo } from "./start-expo";
import { setupGit } from "./setup-git";

export const setupContainer = task({
  id: "setup-container",
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: {
    appId: string;
    appName: string;
    containerId: string;
    sandboxId: string;
  }) => {
    console.log(
      "[setupContainer] Starting container setup with payload:",
      payload,
    );
    const { appId, appName, containerId, sandboxId } = payload;

    try {
      // Step 1: Setup Git repository
      console.log("[setupContainer] Step 1: Setting up Git repository");
      await setupGit.trigger({
        appId,
        containerId,
      });

      // Step 2: Configure Convex
      console.log("[setupContainer] Step 2: Configuring Convex");
      await configureConvex.trigger({
        appId,
        containerId,
      });

      // Step 3: Start Expo after Convex and Git are configured
      console.log("[setupContainer] Step 3: Starting Expo");
      await startExpo.trigger({
        appId,
        appName,
        containerId,
        sandboxId,
      });

      console.log("[setupContainer] Container setup completed successfully");
    } catch (error) {
      console.error("[setupContainer] Error in container setup:", error);
      throw error;
    }
  },
});
