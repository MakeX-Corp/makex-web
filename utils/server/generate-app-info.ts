import { generateObject } from "ai";
import { z } from "zod";
import { CLAUDE_SONNET_4_MODEL, APP_CATEGORIES } from "@/const";
import { gateway } from "@/utils/server/gateway";

export interface AppInfoInput {
  appName: string;
  displayName: string;
  userPrompt: string;
  appUrl?: string;
}

export interface GeneratedAppInfo {
  description: string;
  category: string;
  imagePrompt: string;
  tags: string[];
}

export async function generateAppInfo(
  input: AppInfoInput,
): Promise<GeneratedAppInfo> {
  try {
    const prompt = `Generate compelling metadata for an app based on the following information:

App Information:
- App Name: ${input.appName}
- Display Name: ${input.displayName}
- User's Description: ${input.userPrompt}
${input.appUrl ? `- App URL: ${input.appUrl}` : ""}

Generate a JSON response with:
1. A compelling description (max 30 characters) that explains what the app does
2. A category that best fits this app from this list: ${APP_CATEGORIES.join(
      ", ",
    )}
3. 3-5 relevant tags for the app
4. A detailed image prompt for generating an app icon or screenshot that represents the app well

Make the description short and catchy, it must not exceed 30 characters. The category should be specific but not too niche. The image prompt should be detailed enough to generate a good visual representation of the app, but must be no more than 300 characters.

Return only valid JSON in this format:
{
  "description": "short description here",
  "category": "category from the list",
  "tags": ["tag1", "tag2", "tag3"],
  "imagePrompt": "detailed image prompt"
}`;

    const result = await generateObject({
      model: gateway(CLAUDE_SONNET_4_MODEL),
      prompt,
      schema: z.object({
        description: z.string().max(30),
        category: z.enum(APP_CATEGORIES as [string, ...string[]]),
        imagePrompt: z.string().max(300),
        tags: z.array(z.string().max(20)).min(3).max(5),
      }),
      providerOptions: {
        gateway: {
          order: ["anthropic", "bedrock", "vertex"],
        },
      },
    });

    return {
      ...result.object,
    };
  } catch (error) {
    console.error("App info generation failed:", error);

    // Return fallback values if generation fails
    return {
      description: `Check out ${input.displayName}`,
      category: "Productivity",
      tags: ["app", "productivity", "modern"],
      imagePrompt: `Show a modern app icon representing ${input.displayName}`,
    };
  }
}
