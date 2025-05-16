import { task } from "@trigger.dev/sdk/v3";
import axios from "axios";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabase } from "@/utils/supabase/basic"; // update path as needed

const embeddingModel = openai.embedding("text-embedding-3-small");

function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export const fetchExpoDocs = task({
  id: "fetch-expo-docs",
  run: async () => {
    const url =
      "https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v53.0.0/sdk/camera.mdx";

    try {
      const response = await axios.get(url);
      const content = response.data;

      const chunks = chunkText(content);
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks,
      });

      const rows = chunks.map((chunk, i) => ({
        content: chunk,
        embedding: embeddings[i],
        source: "camera.mdx",
        category: "expo",
      }));

      const { error } = await supabase.from("embeddings").insert(rows);
      if (error) throw error;

      return {
        status: "success",
        count: rows.length,
      };
    } catch (error) {
      console.error("❌ Error:", error);
      return {
        status: "error",
        message: "Failed to fetch, embed, or insert data",
      };
    }
  },
});
