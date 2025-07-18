import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { generateObject } from "ai";
import { z } from "zod";
import { getBedrockClient } from "@/utils/server/bedrock-client";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";

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
    const model = getBedrockClient()(CLAUDE_SONNET_4_MODEL);
    const result = await generateObject({
      model,
      prompt: `Generate a short, catchy title for an app based on this idea:\n\n"${initialPrompt}"\n\nOnly return the title.`,
      schema: z.object({
        title: z.string().max(20),
      }),
    });

    return result.object.title || fallback;
  } catch (error) {
    console.error("Claude title generation failed:", error);
    return fallback;
  }
}
