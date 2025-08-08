import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateAppImageBase64(
  prompt: string,
): Promise<string | undefined> {
  try {
    const imageResult = await openai.images.generate({
      model: "dall-e-2",
      prompt: `${prompt}. Simple, clean app icon.`,
      size: "256x256",
      response_format: "url",
    });

    const imageUrl = imageResult.data?.[0]?.url;
    if (!imageUrl) return undefined;

    const res = await fetch(imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());

    const resizedBuffer = await sharp(buffer)
      .resize(256, 256)
      .png({ quality: 80 })
      .toBuffer();

    return `data:image/png;base64,${resizedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error generating app image:", error);
    return undefined;
  }
}
