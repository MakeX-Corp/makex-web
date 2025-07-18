import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { dub } from "@/utils/server/dub";
import { sendPushNotifications } from "@/utils/server/sendPushNotifications";
import { deployWebFromGit } from "@/utils/server/freestyle";



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
      .from("url_mappings")
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
  appName: string,
  deploymentUrl: string,
  easUrl?: string
) {
  try {
    const { data: existingMapping } = await supabase
      .from("url_mappings")
      .select("dub_id,dub_key")
      .eq("app_id", appId)
      .single();

    const title = `Check out my ${appName} app`;
    const description = `I created this app using MakeX - a powerful platform for building and deploying applications. Try it out!`;

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
        .from("url_mappings")
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

    const result = await supabase.from("url_mappings").insert({
      app_id: appId,
      share_url: dubLink.shortLink || dubLink.url,
      web_url: deploymentUrl,
      app_url: easUrl,
      dub_id: dubLink.id,
      dub_key: dubLink.key,
      share_id: shareId,
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
  easUrl?: string
) {
  try {
    const updateData: any = { status };
    if (deploymentUrl) updateData.web_url = deploymentUrl;
    if (easUrl) updateData.app_url = easUrl;

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
      `[DeployWeb] Successfully updated deployment status to ${status}`
    );
  } catch (error) {
    console.error("[DeployWeb] Error updating deployment status:", error);
    throw error;
  }
}

export const deployWeb = task({
  id: "deploy-web",
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: { appId: string }) => {
    console.log(`[DeployWeb] Starting deployment for appId: ${payload.appId}`);
    const { appId } = payload;
    const supabase = await getSupabaseAdmin();
    let deploymentId: string | undefined;

    try {
      // Get app record
      console.log(`[DeployWeb] Fetching app record for appId: ${appId}`);
      const { data: appRecord } = await supabase
        .from("user_apps")
        .select("api_url,user_id,app_name,git_repo_id")
        .eq("id", appId)
        .single();

      if (!appRecord) {
        throw new Error("App record not found");
      }

      const { user_id, app_name, git_repo_id } = appRecord;
      console.log(
        `[DeployWeb] Found app record - name: ${app_name}, userId: ${user_id}, gitRepoId: ${git_repo_id}`
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
          type: "web",
        })
        .select()
        .single();

      if (createError) {
        console.error(
          "[DeployWeb] Error creating deployment record:",
          createError
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
        `[DeployWeb] Created deployment record with ID: ${deploymentId}`
      );

      try {
        // Deploy to Freestyle using Git repository
        console.log(`[DeployWeb] Starting Freestyle deployment`);
        
        const deploymentResult = await deployWebFromGit(
          git_repo_id,
          [`${app_name}.style.dev`],
          true
        );

        console.log(`[DeployWeb] Freestyle deployment completed successfully`);
        console.log(`[DeployWeb] Deployment domains:`, deploymentResult.domains);

        const deploymentUrl = deploymentResult.domains?.[0];
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
          easUrl
        );

        // Handle URL mapping
        console.log(`[DeployWeb] Setting up URL mapping`);
        const { dubLink } = await handleUrlMapping(
          supabase,
          appId,
          app_name,
          deploymentUrl,
          easUrl
        );
        console.log(`[DeployWeb] URL mapping completed`);

        console.log(`[DeployWeb] Deployment completed successfully`);
        return {
          deploymentUrl,
          easUrl,
          dubLink,
        };
      } catch (error) {
        console.error("[DeployWeb] Error during deployment process:", error);
        // Update status to failed
        await updateDeploymentStatus(supabase, deploymentId, "failed");
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
