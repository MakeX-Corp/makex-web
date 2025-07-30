import { generateObject } from "ai";
import { z } from "zod";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";
import { gateway } from "@/utils/server/gateway";

export async function generateCheckpointInfo(
  aiMessage: string,
): Promise<{ name: string; message: string }> {
  try {
    const result = await generateObject({
      model: gateway(CLAUDE_SONNET_4_MODEL),
      prompt: `Based on this AI assistant message, generate a checkpoint name and descriptive message:

"${aiMessage}"

You must respond with a valid JSON object in this exact format:
{
  "name": "checkpoint-name-here",
  "message": "Descriptive message about what changes were made"
}

The name should be:
- Short and descriptive (max 30 characters)
- Use kebab-case format
- Relevant to the changes made
- No special characters except hyphens

The message should be:
- Clear and descriptive
- Explain what changes were implemented
- Professional tone
- Max 100 characters

Only return the JSON object, nothing else.`,
      schema: z.object({
        name: z.string().max(30),
        message: z.string().max(100),
      }),
      providerOptions: {
        gateway: {
          order: ["anthropic", "bedrock", "vertex"],
        },
      },
    });

    return {
      name: result.object.name || "ai-assistant-checkpoint",
      message: result.object.message || "Checkpoint after AI assistant changes",
    };
  } catch (error) {
    console.error("Checkpoint generation failed:", error);
    return {
      name: "ai-assistant-checkpoint",
      message: "Checkpoint after AI assistant changes",
    };
  }
}
