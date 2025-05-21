import { task } from "@trigger.dev/sdk/v3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import AdmZip from "adm-zip";
import { Readable } from "stream";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { proxySetter } from "@/utils/server/redis-client";
import { dub } from "@/utils/server/dub";
import { resumeContainer } from "./resume-container";

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

const s3Client = new S3Client({
  region: "us-east-2",
  endpoint: "https://s3.us-east-2.amazonaws.com",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.DEPLOYMENT_BUCKET_NAME!;
const PUBLIC_URL_BASE = process.env.DEPLOYMENT_PUBLIC_URL_BASE!;

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
};

function getMimeType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".") || 0);
  return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
}

function shareIdGenerator(appId: string): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use appId as seed by summing its character codes
  const seed = appId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate 6 characters using the seed
  for (let i = 0; i < 6; i++) {
    const index = (seed + i * 31) % characters.length; // 31 is a prime number for better distribution
    result += characters[index];
  }
  
  return result;
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

    // If mapping exists, update web_url but keep the existing Dub link
    if (existingMapping?.dub_id) {
      const result = await supabase
        .from("url_mappings")
        .update({
          web_url: deploymentUrl,
          app_url: easUrl,
        })
        .eq("app_id", appId);
      return { dubLink: { id: existingMapping.dub_id, key: existingMapping.dub_key }, result };
    }

    // Create new Dub link only if it doesn't exist
    const shareId = shareIdGenerator(appId);
    const dubLink = await dub.links.create({
      url: `https://makex.app/share/${shareId}`,
      proxy: true,
      domain: "makexapp.link",
      title: `Checkout this app I created `,
      image: "https://makex.app/share.png",
      description: `I created this app using MakeX - a powerful platform for building and deploying applications. Try it out!`,
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
    
    console.log(`[DeployWeb] Successfully updated deployment status to ${status}`);
  } catch (error) {
    console.error("[DeployWeb] Error updating deployment status:", error);
    throw error;
  }
}

async function uploadFilesToS3(
  zip: AdmZip,
  deploymentBasePath: string,
  hasDistDir: boolean
) {
  try {
    const baseDirToRemove = hasDistDir ? "dist/" : "";
    const uploadPromises = zip
      .getEntries()
      .filter((entry: any) => !entry.isDirectory)
      .filter((entry: any) =>
        hasDistDir ? entry.entryName.startsWith(baseDirToRemove) : true
      )
      .map((entry: any) => {
        const relativePath = hasDistDir
          ? entry.entryName.substring(baseDirToRemove.length)
          : entry.entryName;

        return s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${deploymentBasePath}/${relativePath}`,
            Body: entry.getData(),
            ContentType: getMimeType(entry.entryName),
            CacheControl:
              getMimeType(entry.entryName).includes("image/") ||
              entry.entryName.includes("assets/")
                ? "public, max-age=31536000"
                : "no-cache",
          })
        );
      });

    await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading files to S3:", error);
    throw error;
  }
}

export const deployWeb = task({
  id: "deploy-web",
  retry: {
    maxAttempts: 0
  },
  run: async (payload: { appId: string }) => {
    console.log(`[DeployWeb] Starting deployment for appId: ${payload.appId}`);
    const { appId } = payload;
    const supabase = await getSupabaseAdmin();
    let deploymentId: string | undefined;

    try {
      // Check sandbox status and resume if needed
      console.log(`[DeployWeb] Checking sandbox status for appId: ${appId}`);
      const { data: sandbox, error: sandboxError } = await supabase
        .from("user_sandboxes")
        .select("*")
        .eq("app_id", appId)
        .order("sandbox_updated_at", { ascending: false })
        .limit(1)
        .single();

      if (sandboxError) {
        throw new Error(`Failed to fetch sandbox status: ${sandboxError.message}`);
      }

      if (!sandbox) {
        throw new Error("No sandbox found for this app");
      }

      // Update sandbox updated_at time
      await supabase
        .from("user_sandboxes")
        .update({ sandbox_updated_at: new Date().toISOString() })
        .eq("id", sandbox.id);

      // If sandbox is paused, resume it and wait for completion
      if (sandbox.sandbox_status === "paused") {
        console.log(`[DeployWeb] Sandbox is paused, resuming...`);
        await resumeContainer.triggerAndWait({
          userId: sandbox.user_id,
          appId,
          appName: sandbox.app_name,
        });
        console.log(`[DeployWeb] Sandbox is now active`);
      }

      // Get app record
      console.log(`[DeployWeb] Fetching app record for appId: ${appId}`);
      const { data: appRecord } = await supabase
        .from("user_apps")
        .select("api_url,user_id,app_name")
        .eq("id", appId)
        .single();

      if (!appRecord) {
        throw new Error("App record not found");
      }

      const { api_url, user_id, app_name } = appRecord;
      console.log(`[DeployWeb] Found app record - name: ${app_name}, userId: ${user_id}`);

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
        console.error("[DeployWeb] Error creating deployment record:", createError);
        throw createError;
      }

      if (!deploymentRecord) {
        throw new Error("Deployment record not found");
      }

      deploymentId = deploymentRecord.id;
      if (!deploymentId) {
        throw new Error("Deployment ID not found");
      }
      console.log(`[DeployWeb] Created deployment record with ID: ${deploymentId}`);

      const deploymentBasePath = `${appId}/${deploymentId}`;
      const fileClient = createFileBackendApiClient(api_url);

      try {
        // Deploy to EAS first
        let easUrl;
        try {
          console.log(`[DeployWeb] Starting EAS deployment`);
          const easResponse = await fileClient.post("/deploy-eas", {
            token: process.env.EXPO_ACCESS_TOKEN,
            message: "Update",
          });
          easUrl = `makex://u.expo.dev/${easResponse.project_id}/group/${easResponse.group_id}`;
          console.log(`[DeployWeb] EAS deployment completed successfully`);
        } catch (easError) {
          console.error("[DeployWeb] EAS deployment failed:", easError);
          // Update status to failed but continue with web deployment
          await updateDeploymentStatus(supabase, deploymentId, "failed");
          throw new Error("EAS deployment failed: " + (easError instanceof Error ? easError.message : String(easError)));
        }

        // Get and process zip file
        console.log(`[DeployWeb] Fetching deployment zip file`);
        const { data } = await fileClient.getBuffer(
          `/deploy-web?appId=${appId}&deploymentId=${deploymentId}`
        );

        const zipBuffer = data instanceof Readable ? await streamToBuffer(data) : data;
        const zip = new AdmZip(zipBuffer);
        const hasDistDir = zip.getEntries().some((entry: any) =>
          entry.entryName.startsWith("dist/")
        );
        console.log(`[DeployWeb] Processing zip file - has dist directory: ${hasDistDir}`);

        // Upload files to S3
        console.log(`[DeployWeb] Starting S3 upload`);
        await uploadFilesToS3(zip, deploymentBasePath, hasDistDir);
        console.log(`[DeployWeb] S3 upload completed`);

        const deploymentUrl = `${PUBLIC_URL_BASE}/${deploymentBasePath}/`;
        const displayUrl = `web-${app_name}.makex.app`;
        console.log(`[DeployWeb] Setting up proxy for display URL: ${displayUrl}`);

        // Set up proxy
        await proxySetter(displayUrl, deploymentUrl);
        console.log(`[DeployWeb] Proxy setup completed`);

        // Update status to completed
        console.log(`[DeployWeb] Updating deployment status to completed`);
        await updateDeploymentStatus(
          supabase, 
          deploymentId, 
          "completed", 
          deploymentUrl,
          easUrl
        );

        // Handle URL mapping with both web and EAS URLs
        console.log(`[DeployWeb] Setting up URL mapping`);
        const { dubLink } = await handleUrlMapping(supabase, appId, app_name, deploymentUrl, easUrl);
        console.log(`[DeployWeb] URL mapping completed`);

        console.log(`[DeployWeb] Deployment completed successfully`);
        return {
          deploymentUrl,
          easUrl,
          dubLink,
        };
      } catch (error) {
        console.error("[DeployWeb] Error during deployment process:", error);
        // Update status to failed with any available URLs
        const deploymentUrl = `${PUBLIC_URL_BASE}/${deploymentBasePath}/`;
        await updateDeploymentStatus(supabase, deploymentId, "failed", deploymentUrl);
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
