import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { generateObject } from "ai";
import { z } from "zod";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";
import { gateway } from "@/utils/server/gateway";

export function generateAppName() {
  const config: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    style: "lowerCase",
    length: 3,
  };
  return uniqueNamesGenerator(config);
}

export async function generateDisplayName(
  initialPrompt: string,
  fallback: string
): Promise<string> {
  try {
    const result = await generateObject({
      model: gateway(CLAUDE_SONNET_4_MODEL),
      prompt: `Generate a short, catchy title for an app based on this idea:

"${initialPrompt}"

You must respond with a valid JSON object in this exact format:
{
  "title": "Your App Title Here"
}

The title should be:
- Short and memorable (max 20 characters)
- Catchy and relevant to the app idea
- No special characters or emojis
- Title case format

Only return the JSON object, nothing else.`,
      schema: z.object({
        title: z.string().max(20),
      }),
      providerOptions: {
        gateway: {
          order: ["anthropic", "bedrock", "vertex"],
        },
      },
    });

    return result.object.title || fallback;
  } catch (error) {
    console.error("Claude title generation failed:", error);
    return fallback;
  }
}
