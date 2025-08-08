import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { dub } from "@/utils/server/dub";
import { sendPushNotifications } from "@/utils/server/sendPushNotifications";
import { deployWebFromGit } from "@/utils/server/freestyle";
import {
  deployConvexProject,
  getConvexProdAdminKey,
} from "@/utils/server/convex";
import {
  createE2BContainer,
  deployConvexProdInContainer,
  killE2BContainer,
} from "@/utils/server/e2b";
import { generateAppInfo } from "@/utils/server/generate-app-info";
import { generateAppImageBase64 } from "@/utils/server/generate-app-image";
async function shareIdGenerator(appId: string, supabase: any): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const maxAttempts = 3; // Maximum number of attempts to generate a unique ID

  // Use appId as seed by summing its character codes
  const seed = appId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Add timestamp component (last 4 digits of current timestamp)
  const timestamp = Date.now().toString().slice(-4);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let result = "";

    // Generate 6 characters using the seed and attempt number
    for (let i = 0; i < 6; i++) {
      const index = (seed + i * 31 + attempt * 17) % characters.length; // Added attempt number for variation
      result += characters[index];
    }

    // Combine with timestamp
    const shareId = `${result}${timestamp}`;

    // Check if this ID already exists
    const { data: existingMapping } = await supabase
      .from("app_listing_info")
      .select("share_id")
      .eq("share_id", shareId)
      .single();

    if (!existingMapping) {
      return shareId;
    }
  }

  // If all attempts failed, generate a completely random ID
  let randomId = "";
  for (let i = 0; i < 6; i++) {
    randomId += characters[Math.floor(Math.random() * characters.length)];
  }
  return `${randomId}${timestamp}`;
}

async function handleUrlMapping(
  supabase: any,
  appId: string,
  displayName: string,
  deploymentUrl: string,
  easUrl?: string,
  userEmail?: string,
) {
  try {
    console.log(`[DeployWeb] Handling URL mapping for appId: ${appId}`);
    const { data: existingMapping } = await supabase
      .from("app_listing_info")
      .select("dub_id,dub_key")
      .eq("app_id", appId)
      .single();

    console.log(`[DeployWeb] Existing mapping: ${existingMapping}`);
    //get app info

    const { data: promptInfo, error } = await supabase
      .from("chat_history")
      .select("plain_text")
      .eq("app_id", appId)
      .eq("role", "user")
      .order("created_at", { ascending: true })
      .limit(5);

    if (error) throw error;

    const userPrompt = promptInfo
      ?.map((row: any) => row.plain_text?.trim())
      .filter(Boolean)
      .join(" ");

    console.log(`[DeployWeb] Generating app info for appId: ${appId}`);
    const appInfo = await generateAppInfo({
      appName: appId,
      displayName: displayName,
      userPrompt:
        "These are the first 5 user prompts for this app: " + userPrompt,
    });
    console.log(`[DeployWeb] App info generated: ${appInfo}`);
    console.log(appInfo);

    const appImage = await generateAppImageBase64(appInfo.imagePrompt);
    console.log(`[DeployWeb] App image generated: ${appImage}`);

    const title = `Check out my ${displayName} app`;
    const description = appInfo.description;

    console.log(`[DeployWeb] Generated title: ${title}`);
    console.log(`[DeployWeb] Generated description: ${description}`);

    // If mapping exists, update web_url but keep the existing Dub link
    if (existingMapping?.dub_id) {
      // Update the Dub link with new title and description
      await dub.links.update(existingMapping.dub_id, {
        title,
        description,
      });

      const result = await supabase
        .from("app_listing_info")
        .update({
          web_url: deploymentUrl,
          app_url: easUrl,
        })
        .eq("app_id", appId);
      return {
        dubLink: { id: existingMapping.dub_id, key: existingMapping.dub_key },
        result,
      };
    }

    // Create new Dub link only if it doesn't exist
    const shareId = await shareIdGenerator(appId, supabase);

    const dubLink = await dub.links.create({
      url: `https://makex.app/share/${shareId}`,
      proxy: true,
      domain: "makexapp.link",
      title,
      image: "https://makex.app/share.png",
      description,
    });

    const result = await supabase.from("app_listing_info").insert({
      app_id: appId,
      share_url: dubLink.shortLink || dubLink.url,
      web_url: deploymentUrl,
      app_url: easUrl,
      dub_id: dubLink.id,
      dub_key: dubLink.key,
      share_id: shareId,
      image: appImage,
      description: appInfo.description,
      category: appInfo.category,
      tags: appInfo.tags,
      author: userEmail,
    });

    return { dubLink, result };
  } catch (error) {
    console.error("Error handling URL mapping:", error);
    throw error;
  }
}

async function updateDeploymentStatus(
  supabase: any,
  deploymentId: string,
  status: "uploading" | "completed" | "failed",
  deploymentUrl?: string,
  easUrl?: string,
  freestyleDeploymentId?: string,
) {
  try {
    const updateData: any = { status };
    if (deploymentUrl) updateData.web_url = deploymentUrl;
    if (easUrl) updateData.app_url = easUrl;
    if (freestyleDeploymentId) updateData.deployment_id = freestyleDeploymentId;

    const { data, error } = await supabase
      .from("user_deployments")
      .update(updateData)
      .eq("id", deploymentId);

    console.log("[DeployWeb] Updated deployment status:", data);

    if (error) {
      console.error("[DeployWeb] Error updating deployment status:", error);
      throw error;
    }

    console.log(
      `[DeployWeb] Successfully updated deployment status to ${status}`,
    );
  } catch (error) {
    console.error("[DeployWeb] Error updating deployment status:", error);
    throw error;
  }
}

async function updateConvexProdUrl(
  supabase: any,
  appId: string,
  deploymentName: string,
) {
  try {
    const convexProdUrl = `https://${deploymentName}.convex.cloud`;

    const { error } = await supabase
      .from("user_apps")
      .update({
        convex_prod_url: convexProdUrl,
      })
      .eq("id", appId);

    if (error) {
      console.error("[DeployWeb] Error updating convex_prod_url:", error);
      throw error;
    }

    console.log(
      `[DeployWeb] Successfully updated convex_prod_url to: ${convexProdUrl}`,
    );
    return convexProdUrl;
  } catch (error) {
    console.error("[DeployWeb] Error updating convex_prod_url:", error);
    throw error;
  }
}

async function updateConvexProdAdminKey(deploymentName: string, appId: string) {
  try {
    const supabase = await getSupabaseAdmin();
    //update the app record with the convex_prod_admin_key
    const convexProdAdminKey = await getConvexProdAdminKey({
      deploymentName: deploymentName,
    });
    const { error } = await supabase
      .from("user_apps")
      .update({
        convex_prod_admin_key: convexProdAdminKey.adminKey,
      })
      .eq("id", appId);

    if (error) {
      console.error("[DeployWeb] Error updating convex_prod_admin_key:", error);
      throw error;
    }
  } catch (error) {
    console.error("[DeployWeb] Error updating convex_prod_admin_key:", error);
    throw error;
  }
}

async function deployConvexInContainer(
  convexDevUrl: string,
  gitRepoId: string,
) {
  let containerId: string | undefined;

  try {
    console.log("[DeployWeb] Creating E2B container for Convex deployment...");

    const containerResult = await createE2BContainer({
      userId: "convex-container",
      appId: "convex-container",
      appName: "convex-container",
    });
    containerId = containerResult.containerId;

    console.log("[DeployWeb] E2B container created:", containerId);

    // Deploy Convex prod in the container
    console.log("[DeployWeb] Deploying Convex prod in container...");
    await deployConvexProdInContainer(containerId, convexDevUrl, gitRepoId);

    console.log("[DeployWeb] Convex prod deployment initiated successfully");

    // Kill the container
    console.log("[DeployWeb] Killing the container...");
    await killE2BContainer(containerId);

    return {
      status: "success",
      containerId: containerId,
    };
  } catch (error: any) {
    console.error(
      "[DeployWeb] Failed to deploy Convex in container:",
      error.message,
    );

    // Kill the container if it was created
    if (containerId) {
      console.log("[DeployWeb] Killing the container due to failure...");
      try {
        await killE2BContainer(containerId);
      } catch (killError: any) {
        console.error(
          "[DeployWeb] Failed to kill container:",
          killError.message,
        );
      }
    }

    return {
      status: "error",
      error: error.message || "Unknown error",
      containerId: containerId,
    };
  }
}

export const deployWeb = task({
  id: "deploy-web",
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: { appId: string; userEmail: string }) => {
    console.log(`[DeployWeb] Starting deployment for appId: ${payload.appId}`);
    const { appId } = payload;
    const supabase = await getSupabaseAdmin();
    let deploymentId: string | undefined;

    try {
      // Get app record
      console.log(`[DeployWeb] Fetching app record for appId: ${appId}`);
      const { data: appRecord } = await supabase
        .from("user_apps")
        .select(
          "user_id,app_name,display_name,git_repo_id,convex_project_id,convex_dev_url",
        )
        .eq("id", appId)
        .single();

      if (!appRecord) {
        throw new Error("App record not found");
      }

      const {
        user_id,
        app_name,
        display_name,
        git_repo_id,
        convex_project_id,
        convex_dev_url,
      } = appRecord;
      console.log(
        `[DeployWeb] Found app record - name: ${app_name}, displayName: ${display_name}, userId: ${user_id}, gitRepoId: ${git_repo_id}, convexProjectId: ${convex_project_id}`,
      );

      if (!git_repo_id) {
        throw new Error("Git repository ID not found for this app");
      }

      // Create deployment record
      console.log(`[DeployWeb] Creating deployment record`);
      const { data: deploymentRecord, error: createError } = await supabase
        .from("user_deployments")
        .insert({
          app_id: appId,
          user_id: user_id,
          status: "uploading",
          type: "freestyle",
        })
        .select()
        .single();

      if (createError) {
        console.error(
          "[DeployWeb] Error creating deployment record:",
          createError,
        );
        throw createError;
      }

      if (!deploymentRecord) {
        throw new Error("Deployment record not found");
      }

      deploymentId = deploymentRecord.id;
      if (!deploymentId) {
        throw new Error("Deployment ID not found");
      }
      console.log(
        `[DeployWeb] Created deployment record with ID: ${deploymentId}`,
      );

      try {
        // Deploy Convex project first if it exists
        let convexProdUrl: string | undefined;

        if (convex_project_id) {
          console.log(
            `[DeployWeb] Starting Convex deployment for project: ${convex_project_id}`,
          );
          try {
            const convexDeployment = await deployConvexProject({
              projectId: convex_project_id,
            });

            console.log(`[DeployWeb] Convex deployment completed successfully`);
            console.log(
              `[DeployWeb] Convex deployment name:`,
              convexDeployment,
            );

            if (convex_dev_url) {
              try {
                const containerResult = await deployConvexInContainer(
                  convex_dev_url,
                  git_repo_id,
                );

                // Update the app record with the convex_prod_url
                convexProdUrl = await updateConvexProdUrl(
                  supabase,
                  appId,
                  convexDeployment.deploymentName,
                );
                // update the app record with the convex_prod_admin_key
                await updateConvexProdAdminKey(
                  convexDeployment.deploymentName,
                  appId,
                );
              } catch (error) {
                console.error(
                  "[DeployWeb] Error during Convex deployment:",
                  error,
                );
                // Don't fail the entire deployment if Convex deployment fails
              }
            } else {
              console.log(
                `[DeployWeb] Skipping container deployment - convex_dev_url not found`,
              );
              // Still update the app record with the convex_prod_url even without container deployment
              convexProdUrl = await updateConvexProdUrl(
                supabase,
                appId,
                convexDeployment.deploymentName,
              );
            }
          } catch (error) {
            console.error(
              "[DeployWeb] Error during Convex project deployment:",
              error,
            );
            // Don't fail the entire deployment if Convex deployment fails
          }
        } else {
          console.log(
            `[DeployWeb] Skipping Convex deployment - no convex_project_id found`,
          );
        }

        // Deploy to Freestyle using Git repository

        // Set environment variables for the deployment
        const envVars: Record<string, string> = {
          ...(convexProdUrl && { EXPO_PUBLIC_CONVEX_URL: convexProdUrl }),
        };

        console.log(`[DeployWeb] Setting environment variables:`, envVars);

        const deploymentResult = await deployWebFromGit(
          git_repo_id,
          [`${app_name}.style.dev`],
          { envVars },
        );

        console.log(`[DeployWeb] Freestyle deployment completed successfully`);
        console.log(
          `[DeployWeb] Deployment domains:`,
          deploymentResult.domains,
        );

        const deploymentUrl = `https://${deploymentResult.domains?.[0]}`;
        if (!deploymentUrl) {
          throw new Error("No deployment URL returned from Freestyle");
        }

        // Convert deployment URL to EAS URL format
        const easUrl = deploymentUrl.replace("https://", "makex://");

        // Update status to completed
        console.log(`[DeployWeb] Updating deployment status to completed`);
        await updateDeploymentStatus(
          supabase,
          deploymentId,
          "completed",
          deploymentUrl,
          easUrl,
          deploymentResult.deploymentId,
        );

        // Handle URL mapping
        console.log(`[DeployWeb] Setting up URL mapping`);
        const { dubLink } = await handleUrlMapping(
          supabase,
          appId,
          display_name,
          deploymentUrl,
          easUrl,
          payload.userEmail,
        );
        console.log(`[DeployWeb] URL mapping completed`);

        console.log(`[DeployWeb] Deployment completed successfully`);
        return {
          deploymentUrl,
          easUrl,
          //convexProdUrl,
          dubLink,
        };
      } catch (error) {
        console.error("[DeployWeb] Error during deployment process:", error);
        if (deploymentId) {
          console.log(`[DeployWeb] Updating deployment status to failed`);
          await updateDeploymentStatus(supabase, deploymentId, "failed");
        }
        throw error;
      } finally {
        // send notification to user
        await sendPushNotifications({
          supabase,
          userId: user_id,
          title: "Deployment completed",
          body: "Your app has been deployed successfully",
        });
      }
    } catch (error) {
      console.error("[DeployWeb] Critical deployment error:", error);
      if (deploymentId) {
        console.log(`[DeployWeb] Updating deployment status to failed`);
        await updateDeploymentStatus(supabase, deploymentId, "failed");
      }
      throw error;
    }
  },
});
