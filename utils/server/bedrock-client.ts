import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

export function getBedrockClient(userId?: string, appId?: string, appName?: string) {
  return createAmazonBedrock({
    baseURL: `https://bedrock.helicone.ai/v1/us-east-1`,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    headers: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "aws-access-key": process.env.AWS_ACCESS_KEY_ID!,
      "aws-secret-key": process.env.AWS_SECRET_ACCESS_KEY!,
      "Helicone-Property-User-ID": userId || "",
      "Helicone-Property-App-ID": appId || "",
      "Helicone-Property-App-Name": appName || "",
      // Disable Helicone response parsing for streaming to avoid JSON parsing errors
      "Helicone-Property-Stream": "true",
      "Helicone-Property-Response-Format": "stream",
    },
  });
}