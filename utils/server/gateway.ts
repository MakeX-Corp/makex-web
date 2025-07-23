import { createGateway } from "@ai-sdk/gateway";

export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://gateway.helicone.ai/v1/ai",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Target-URL": "https://ai-gateway.vercel.sh",
    "Helicone-Target-Provider": "VERCEL",
  },
});
