import { schedules } from "@trigger.dev/sdk/v3";
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

// Add delay function with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add retry function with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3) {
  let retries = 0;
  while (true) {
    try {
      return await axios.get(url);
    } catch (error: any) {
      if (error.response?.status === 429 && retries < maxRetries) {
        const backoffTime = Math.pow(2, retries) * 2000; // 2s, 4s, 8s
        console.log(`Rate limited, retrying in ${backoffTime/1000}s...`);
        await delay(backoffTime);
        retries++;
        continue;
      }
      throw error;
    }
  }
}

export const fetchOpenAIDocs = schedules.task({
  id: "fetch-openai-docs",
  // Run every Sunday at midnight UTC
  cron: "0 0 * * 0",
  run: async (payload) => {
    // 1. Delete existing OpenAI docs
    const { error: deleteError } = await supabase
      .from("embeddings")
      .delete()
      .eq("category", "openai");

    if (deleteError) {
      console.error("❌ Error deleting existing OpenAI docs:", deleteError);
      return {
        status: "error",
        message: "Failed to delete existing OpenAI docs",
      };
    }

    // 2. Fetch the OpenAPI YAML file
    const rawUrl = "https://raw.githubusercontent.com/openai/openai-openapi/manual_spec/openapi.yaml";
    try {
      const response = await fetchWithRetry(rawUrl);
      const content = response.data;

      const chunks = chunkText(content);
      
      // Process embeddings in batches to avoid token limit
      const batchSize = 50; // Process 50 chunks at a time
      let totalChunks = 0;
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        const { embeddings } = await embedMany({
          model: embeddingModel,
          values: batch,
        });

        const rows = batch.map((chunk, j) => ({
          content: chunk,
          embedding: embeddings[j],
          source: "openapi.yaml",
          category: "openai",
        }));

        const { error } = await supabase.from("embeddings").insert(rows);
        if (error) throw error;
        
        totalChunks += rows.length;
        
        // Add small delay between batches to avoid rate limits
        if (i + batchSize < chunks.length) {
          await delay(1000);
        }
      }

      return {
        status: "success",
        totalChunks: totalChunks,
      };
    } catch (error) {
      console.error("❌ Error fetching or processing OpenAI YAML:", error);
      return {
        status: "error",
        message: "Failed to fetch or process OpenAI YAML",
      };
    }
  },
});
