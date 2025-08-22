import { task } from "@trigger.dev/sdk";
import { setupQueue } from "./setup-queue";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import {
  createGitRepository,
  grantGitPermission,
  deleteGitRepository,
} from "@/utils/server/freestyle";
import { setupFreestyleGitInContainer } from "@/utils/server/e2b";

export const setupGit = task({
  id: "setup-git",
  queue: setupQueue,
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: { appId: string; containerId: string }) => {
    console.log("[setupGit] Starting trigger with payload:", payload);
    const { appId, containerId } = payload;
    const adminSupabase = await getSupabaseAdmin();
    let repoId: string | null = null;

    try {
      // Get app details from the database
      const { data: app, error: appError } = await adminSupabase
        .from("user_apps")
        .select("*")
        .eq("id", appId)
        .single();

      if (appError || !app) {
        throw new Error("Failed to fetch app details");
      }

      console.log("[setupGit] App details:", app);

      // Create a Git repository
      console.log("[setupGit] Creating Git repository...");
      const repoResponse = await createGitRepository(`${app.app_name}`);

      repoId = repoResponse.repoId;
      console.log("[setupGit] Git repository created with ID:", repoId);

      if (!repoId) {
        throw new Error(
          "Failed to create Git repository - no repo ID returned",
        );
      }

      // Get the identity ID from environment variables
      const identityId = process.env.FREESTYLE_IDENTITY_ID;
      if (!identityId) {
        throw new Error(
          "FREESTYLE_IDENTITY_ID environment variable is not set",
        );
      }

      // Grant write access to the identity
      console.log("[setupGit] Granting write access to identity:", identityId);
      await grantGitPermission({
        identityId: identityId,
        repoId: repoId,
        permission: "write",
      });

      console.log("[setupGit] Write access granted successfully");

      // Set up Git in the E2B container
      console.log("[setupGit] Setting up Git in E2B container...");
      const gitSetupResult = await setupFreestyleGitInContainer(
        containerId,
        repoId!,
      );

      // Save the repository ID to the database
      console.log("[setupGit] Saving repository ID to database...");

      // Safely extract the initial commit hash, handling cases where git rev-parse HEAD might fail
      let initialCommit = null;
      if (
        gitSetupResult.commitIdResult &&
        gitSetupResult.commitIdResult.stdout &&
        gitSetupResult.commitIdResult.stdout.trim()
      ) {
        initialCommit = gitSetupResult.commitIdResult.stdout.trim();
        console.log("[setupGit] Initial commit hash:", initialCommit);
      } else {
        console.log(
          "[setupGit] No initial commit hash available - git repository may be empty",
        );
      }

      const { error: updateError } = await adminSupabase
        .from("user_apps")
        .update({
          git_repo_id: repoId,
          initial_commit: initialCommit,
        })
        .eq("id", appId);

      if (updateError) {
        throw new Error(
          `Failed to update app with git repo ID: ${updateError.message}`,
        );
      }

      console.log("[setupGit] Repository ID saved to database successfully");

      return {
        success: true,
        repoId: repoId,
        appId: appId,
        containerId: containerId,
        gitSetupResult: gitSetupResult,
      };
    } catch (error) {
      console.error("[setupGit] Error in trigger execution:", error);

      // Cleanup: Delete the Git repository if it was created
      if (repoId) {
        try {
          console.log(
            "[setupGit] Cleaning up: Deleting Git repository:",
            repoId,
          );
          await deleteGitRepository(repoId);
          console.log("[setupGit] Git repository deleted successfully");
        } catch (deleteError) {
          console.error(
            "[setupGit] Failed to delete Git repository:",
            deleteError,
          );
        }
      }

      // Cleanup: Clear the git_repo_id from the database
      try {
        console.log(
          "[setupGit] Cleaning up: Clearing git_repo_id from database",
        );
        const { error: clearError } = await adminSupabase
          .from("user_apps")
          .update({
            git_repo_id: null,
          })
          .eq("id", appId);

        if (clearError) {
          console.error(
            "[setupGit] Failed to clear git_repo_id from database:",
            clearError,
          );
        } else {
          console.log(
            "[setupGit] git_repo_id cleared from database successfully",
          );
        }
      } catch (clearError) {
        console.error(
          "[setupGit] Error clearing git_repo_id from database:",
          clearError,
        );
      }

      throw error;
    }
  },
});
