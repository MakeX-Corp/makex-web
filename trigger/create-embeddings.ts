import { task } from "@trigger.dev/sdk/v3";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabase } from "@/utils/supabase/basic";

const embeddingModel = openai.embedding("text-embedding-3-small");

function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export const createEmbeddings = task({
  id: "create-embeddings",
  run: async (payload: {
    content: string;
    source: string;
    category: string;
  }) => {
    try {
      // 1. Chunk the content
      const chunks = chunkText(payload.content);

      // 2. Generate embeddings for chunks
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks,
      });

      // 3. Prepare rows for Supabase
      const rows = chunks.map((chunk, i) => ({
        content: chunk,
        embedding: embeddings[i],
        source: payload.source,
        category: payload.category,
      }));

      // 4. Save to Supabase
      const { error } = await supabase.from("embeddings").insert(rows);

      if (error) {
        throw error;
      }

      return {
        status: "success",
        totalChunks: rows.length,
      };
    } catch (error) {
      console.error("❌ Error creating embeddings:", error);
      return {
        status: "error",
        message: "Failed to create embeddings",
      };
    }
  },
});
