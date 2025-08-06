import { createGateway } from "@ai-sdk/gateway";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";

export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://vercel.helicone.ai/v1/ai",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});



// Map model names to gateway models and determine provider order
export const getModelAndOrder = (modelName: string) => {
  switch (modelName) {
    case "claude-3-7-sonnet-latest":
      return {
        model: "anthropic/claude-3-7-sonnet",
        order: ["bedrock", "vertex", "anthropic"]
      };
    case "gpt-4-5-turbo":
      return {
        model: "openai/gpt-4o",
        order: ["openai"]
      };
    case "gemini-2-5-pro":
      return {
        model: "google/gemini-2.5-pro",
        order: ["vertex"]
      };
    case "claude-4.1-opus":
      return {
        model: "anthropic/claude-4.1-opus",
        order: ["bedrock", "vertex", "anthropic"]
      };
    case "claude-4-sonnet-latest":
    default:
      return {
        model: CLAUDE_SONNET_4_MODEL,
        order: ["bedrock", "vertex", "anthropic"]
      };
  }
};
