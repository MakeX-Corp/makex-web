import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import AdmZip from "adm-zip";
import { Readable } from "stream";

/**
 * Convert a stream to a buffer
 * @param stream The readable stream to convert
 * @returns A promise that resolves to a buffer
 */
export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
// Initialize S3 client
const s3Client = new S3Client({
  region: "us-east-2",
  endpoint: "https://s3.us-east-2.amazonaws.com",
  credentials: {
    accessKeyId: process.env.DEPLOYMENT_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.DEPLOYMENT_AWS_SECRET_ACCESS_KEY || "",
  },
});

// S3 bucket name
const BUCKET_NAME = process.env.DEPLOYMENT_BUCKET_NAME || "makex-app";
const PUBLIC_URL_BASE =
  process.env.DEPLOYMENT_PUBLIC_URL_BASE ||
  "https://makex-app.s3.us-east-2.amazonaws.com";

// MIME type mapping for proper Content-Type headers
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

// Get MIME type based on file extension
function getMimeType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".") || 0);
  return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
}

export async function POST(req: Request) {
  try {
    const { apiUrl, appId } = await req.json();
    console.log("apiUrl", apiUrl);
    console.log("appId", appId);
    // Get user info and validate authentication
    const userResult = await getSupabaseWithUser(req as NextRequest);
    if (userResult instanceof NextResponse || "error" in userResult)
      return userResult;
    const { user } = userResult;

    try {
      // Get the deployment files
      const localUrl = "http://localhost:8001";
      console.log("localUrl", localUrl);
      const fileClient = createFileBackendApiClient(localUrl);
      const { data, headers } = await fileClient.getFile("/deploy-web");

      // Convert data to buffer if it's a stream
      const zipBuffer =
        data instanceof Readable ? await streamToBuffer(data) : data;

      // Generate a unique deployment ID
      const deploymentId = `${appId}-${Date.now()}`;
      const deploymentBasePath = `deployments/${appId}/${deploymentId}`;

      // Store the zip file for reference
      const zipS3Key = `${deploymentBasePath}/app.zip`;

      console.log("zipS3Key", zipS3Key);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: zipS3Key,
          Body: zipBuffer,
          ContentType: "application/zip",
        })
      );

      console.log("zipS3Key uploaded");

      // Extract and upload each file in the zip
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();

      console.log("zipEntries", zipEntries);

      // Check if there's a dist/ directory in the zip and adjust paths accordingly
      const hasDistDir = zipEntries.some((entry) =>
        entry.entryName.startsWith("dist/")
      );
      const baseDirToRemove = hasDistDir ? "dist/" : "";

      // Promise for all uploads
      const uploadPromises = zipEntries
        .filter((entry) => !entry.isDirectory)
        .filter((entry) => {
          const fileName = entry.entryName;
          return hasDistDir ? fileName.startsWith(baseDirToRemove) : true;
        })
        .map(async (entry) => {
          // Remove the dist/ prefix if it exists
          const relativePath = hasDistDir
            ? entry.entryName.substring(baseDirToRemove.length)
            : entry.entryName;

          const s3Key = `${deploymentBasePath}/${relativePath}`;
          const contentType = getMimeType(entry.entryName);

          return s3Client.send(
            new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: s3Key,
              Body: entry.getData(),
              ContentType: contentType,
              CacheControl:
                contentType.includes("image/") ||
                contentType.includes("font/") ||
                entry.entryName.includes("assets/")
                  ? "public, max-age=31536000" // 1 year cache for static assets
                  : "no-cache", // No cache for HTML/JS/CSS to ensure latest version
            })
          );
        });

      await Promise.all(uploadPromises);

      // Generate a deployment URL for the frontend
      const deploymentUrl = `${PUBLIC_URL_BASE}/${deploymentBasePath}/index.html`;
      console.log("deploymentUrl", deploymentUrl);

      // You might want to store deployment info in your database
      // const { data: deployment } = await supabase.from("user_deployments").insert({
      //   id: deploymentId,
      //   app_id: appId,
      //   user_id: user.id,
      //   status: "completed",
      //   url: deploymentUrl,
      //   created_at: new Date().toISOString()
      // }).select().single();

      return NextResponse.json({
        success: true,
        message: "Deployment completed successfully",
        deploymentId,
        deploymentUrl,
      });
    } catch (error: any) {
      console.error("Deploy error:", error);
      return NextResponse.json(
        { error: error.message || "Deployment failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Deploy route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
