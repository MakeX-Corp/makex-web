import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";

export async function generateAppImageBase64(
  prompt: string,
): Promise<string | undefined> {
  try {
    const { image } = await generateImage({
      model: openai.imageModel("dall-e-2"),
      prompt: `${prompt}. Simple, clean app icon.`,
      size: "256x256",
    });

    if (!image) return undefined;

    const base64 = image.base64;
    return "data:image/png;base64," + base64;
  } catch (error) {
    console.error("Error generating app image:", error);
    return undefined;
  }
}
