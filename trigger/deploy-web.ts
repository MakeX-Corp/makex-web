import { task } from "@trigger.dev/sdk";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { dub } from "@/utils/server/dub";
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
import { generateShareId } from "@/utils/server/share-id-generator";

async function handleUrlMapping(
  supabase: any,
  appId: string,
  displayName: string,
  deploymentUrl: string,
  easUrl?: string,
  userEmail?: string,
  deployData?: {
    category: string;
    description: string;
    tags: string[];
    icon: string;
    isPublic: boolean;
    aiGeneratedDetails: boolean;
    aiGeneratedIcon: boolean;
  },
) {
  try {
    console.log(`[DeployWeb] Handling URL mapping for appId: ${appId}`);
    const { data: existingMapping } = await supabase
      .from("app_listing_info")
      .select("dub_id,dub_key")
      .eq("app_id", appId)
      .single();

    console.log(`[DeployWeb] Existing mapping: ${existingMapping}`);

    if (existingMapping?.dub_id) {
      await dub.links.update(existingMapping.dub_id, {
        title: `Check out my ${displayName} app`,
        description: "Check out this amazing app built with MakeX!",
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

    let appInfo: any;
    let appImage: string;
    let category: string = "";
    let description: string = "";
    let tags: string[] = [];
    let icon: string = "";

    let promptInfo: any[] = [];
    let userPrompt: string = "";

    if (
      deployData &&
      (deployData.aiGeneratedDetails || deployData.aiGeneratedIcon)
    ) {
      console.log(`[DeployWeb] Fetching prompt info for AI generation`);
      const { data: promptData, error } = await supabase
        .from("chat_history")
        .select("plain_text")
        .eq("app_id", appId)
        .eq("role", "user")
        .order("created_at", { ascending: true })
        .limit(5);

      if (error) throw error;

      promptInfo = promptData || [];
      userPrompt = promptInfo
        .map((row: any) => row.plain_text?.trim())
        .filter(Boolean)
        .join(" ");
    }

    if (deployData && !deployData.aiGeneratedDetails) {
      category = deployData.category || "";
      description = deployData.description || "";
      tags = deployData.tags || [];
      console.log(
        `[DeployWeb] Using manually provided app details for appId: ${appId}`,
      );
    } else if (deployData && deployData.aiGeneratedDetails) {
      console.log(
        `[DeployWeb] Generating app details with AI for appId: ${appId}`,
      );

      appInfo = await generateAppInfo({
        appName: appId,
        displayName: displayName,
        userPrompt:
          "These are the first 5 user prompts for this app: " + userPrompt,
      });
      console.log(`[DeployWeb] App info generated: ${appInfo}`);

      category = appInfo.category || "";
      description = appInfo.description || "";
      tags = appInfo.tags || [];
    }

    if (deployData && !deployData.aiGeneratedIcon) {
      icon = deployData.icon !== "ai-generated" ? deployData.icon : "";
      console.log(
        `[DeployWeb] Using manually provided icon for appId: ${appId}`,
      );
    } else {
      console.log(
        `[DeployWeb] Generating app icon with AI for appId: ${appId}`,
      );

      let imagePrompt: string = "";

      if (appInfo && appInfo.imagePrompt) {
        // CASE 1: We already generated app info with AI, so it has a specific image prompt
        imagePrompt = appInfo.imagePrompt;
        console.log(
          `[DeployWeb] Using image prompt from AI-generated app info: ${imagePrompt}`,
        );
      } else if (description) {
        // CASE 2: We have a description (either manual or from AI), use it to create an image prompt
        imagePrompt = `Create an app icon for: ${description}`;
        console.log(
          `[DeployWeb] Using description as image prompt: ${description}`,
        );
      } else {
        // CASE 3: We have NO description at all, so we need to generate minimal app info just for the icon
        // This is the fallback case - we don't want to call generateAppInfo twice if we already have it
        console.log(
          `[DeployWeb] No description available, generating minimal app info for icon`,
        );

        const tempAppInfo = await generateAppInfo({
          appName: appId,
          displayName: displayName,
          userPrompt:
            "These are the first 5 user prompts for this app: " + userPrompt,
        });

        imagePrompt =
          tempAppInfo.imagePrompt ||
          `Create an app icon for: ${tempAppInfo.description || displayName}`;
        console.log(
          `[DeployWeb] Generated fallback image prompt: ${imagePrompt}`,
        );
      }

      if (imagePrompt) {
        appImage = (await generateAppImageBase64(imagePrompt)) || "";
        console.log(
          `[DeployWeb] App image generated using prompt: ${imagePrompt}`,
        );
        icon = appImage || "";
      } else {
        console.log(
          `[DeployWeb] No image prompt available, skipping icon generation`,
        );
        icon = "";
      }
    }

    const title = `Check out my ${displayName} app`;

    const shareId = await generateShareId(supabase, appId);

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
      image: icon,
      description: description,
      category: category,
      tags: tags,
      is_public: deployData?.isPublic,
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

    console.log("[DeployWeb] Deploying Convex prod in container...");
    await deployConvexProdInContainer(containerId, convexDevUrl, gitRepoId);

    console.log("[DeployWeb] Convex prod deployment initiated successfully");

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
  run: async (payload: {
    appId: string;
    userEmail: string;
    deployData?: {
      category: string;
      description: string;
      tags: string[];
      icon: string;
      isPublic: boolean;
      aiGeneratedDetails: boolean;
      aiGeneratedIcon: boolean;
    };
  }) => {
    console.log(`[DeployWeb] Starting deployment for appId: ${payload.appId}`);
    const { appId, deployData } = payload;
    const supabase = await getSupabaseAdmin();
    let deploymentId: string | undefined;

    try {
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

                convexProdUrl = await updateConvexProdUrl(
                  supabase,
                  appId,
                  convexDeployment.deploymentName,
                );
                await updateConvexProdAdminKey(
                  convexDeployment.deploymentName,
                  appId,
                );
              } catch (error) {
                console.error(
                  "[DeployWeb] Error during Convex deployment:",
                  error,
                );
              }
            } else {
              console.log(
                `[DeployWeb] Skipping container deployment - convex_dev_url not found`,
              );
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
          }
        } else {
          console.log(
            `[DeployWeb] Skipping Convex deployment - no convex_project_id found`,
          );
        }

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

        const easUrl = deploymentUrl.replace("https://", "makex://");

        console.log(`[DeployWeb] Updating deployment status to completed`);
        await updateDeploymentStatus(
          supabase,
          deploymentId,
          "completed",
          deploymentUrl,
          easUrl,
          deploymentResult.deploymentId,
        );

        console.log(`[DeployWeb] Setting up URL mapping`);
        const { dubLink } = await handleUrlMapping(
          supabase,
          appId,
          display_name,
          deploymentUrl,
          easUrl,
          payload.userEmail,
          deployData,
        );
        console.log(`[DeployWeb] URL mapping completed`);

        console.log(`[DeployWeb] Deployment completed successfully`);
        return {
          deploymentUrl,
          easUrl,
          convexProdUrl,
          dubLink,
        };
      } catch (error) {
        console.error("[DeployWeb] Error during deployment process:", error);
        if (deploymentId) {
          console.log(`[DeployWeb] Updating deployment status to failed`);
          await updateDeploymentStatus(supabase, deploymentId, "failed");
        }
        throw error;
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
