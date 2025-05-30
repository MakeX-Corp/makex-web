import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

export function getBedrockClient() {
  return createAmazonBedrock({
    region: "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  });
} 