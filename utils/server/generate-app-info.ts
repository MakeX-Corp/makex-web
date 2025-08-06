import { generateObject } from "ai";
import { z } from "zod";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";
import { gateway } from "@/utils/server/gateway";

export interface AppInfoInput {
  appName: string;
  displayName: string;
  userPrompt: string; // The actual user's description of what they want to build
  appUrl?: string;
}

export interface GeneratedAppInfo {
  description: string;
  category: string;
  imagePrompt: string;
  tags: string[];
  imageBase64?: string;
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

Generate:
1. A compelling description (max 30 characters) that explains what the app does
2. A category that best fits this app (e.g., "Productivity", "Social", "Gaming", "Education", "Finance", "Health", "Entertainment", "Developer Tools", "Business", "Lifestyle")
3. A detailed image prompt for generating an app icon or screenshot that represents the app well
4. 3-5 relevant tags for the app

Make the description short and catchy. The category should be specific but not too niche. The image prompt should be detailed enough to generate a good visual representation of the app.`;

    const result = await generateObject({
      model: gateway(CLAUDE_SONNET_4_MODEL),
      prompt,
      schema: z.object({
        description: z.string().max(30),
        category: z.string().max(50),
        imagePrompt: z.string().max(300),
        tags: z.array(z.string().max(20)).min(3).max(5),
      }),
      providerOptions: {
        gateway: {
          order: ["anthropic", "bedrock", "vertex"],
        },
      },
    });

    // Generate a small image using the image prompt
    let imageBase64: string | undefined;
    try {
      const imageResult = await generateObject({
        model: gateway(CLAUDE_SONNET_4_MODEL),
        prompt: `Generate a small, simple app icon (64x64 pixels) based on this description: ${result.object.imagePrompt}. The icon should be minimalist and represent the app's core functionality.`,
        schema: z.object({
          imageBase64: z
            .string()
            .describe(
              "Base64 encoded PNG image, 64x64 pixels, simple and clean design",
            ),
        }),
        providerOptions: {
          gateway: {
            order: ["anthropic", "bedrock", "vertex"],
          },
        },
      });

      imageBase64 = imageResult.object.imageBase64;
    } catch (imageError) {
      console.error("Image generation failed:", imageError);
      // Continue without image if generation fails
    }

    return {
      ...result.object,
      imageBase64,
    };
  } catch (error) {
    console.error("App info generation failed:", error);

    // Return fallback values if generation fails
    return {
      description: `Check out ${input.displayName}`,
      category: "Productivity",
      imagePrompt: `A modern app icon representing ${input.displayName}, clean design, professional look`,
      tags: ["app", "productivity", "modern"],
    };
  }
}
