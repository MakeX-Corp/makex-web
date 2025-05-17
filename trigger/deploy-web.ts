import { task } from "@trigger.dev/sdk/v3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import AdmZip from "adm-zip";
import { Readable } from "stream";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

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
    accessKeyId: process.env.DEPLOYMENT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DEPLOYMENT_AWS_SECRET_ACCESS_KEY!,
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

export const deployWeb = task({
  id: "deploy-web",
  run: async (payload: {
    appId: string;
    apiUrl: string;
    deploymentId: string;
  }) => {
    const { appId, apiUrl, deploymentId } = payload;

    const deploymentBasePath = `${appId}/${deploymentId}`;
    const supabase = await getSupabaseAdmin();
    const fileClient = createFileBackendApiClient("http://localhost:8001");

    const { data } = await fileClient.getFile("/deploy-web");
    const zipBuffer =
      data instanceof Readable ? await streamToBuffer(data) : data;

    // Unzip and upload files
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    const hasDistDir = zipEntries.some((entry: any) =>
      entry.entryName.startsWith("dist/")
    );
    const baseDirToRemove = hasDistDir ? "dist/" : "";

    const uploadPromises = zipEntries
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

    const deploymentUrl = `${PUBLIC_URL_BASE}/${deploymentBasePath}/index.html`;

    await supabase
      .from("user_deployments")
      .update({
        url: deploymentUrl,
        status: "completed",
      })
      .eq("id", deploymentId);

    return {
      deploymentUrl,
    };
  },
});
