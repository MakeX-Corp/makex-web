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

export const fetchExpoDocs = schedules.task({
  id: "fetch-expo-docs",
  // Run every Sunday at midnight UTC
  cron: "0 0 * * 0",
  run: async (payload) => {
    // 1. Delete existing Expo docs
    const { error: deleteError } = await supabase
      .from("embeddings")
      .delete()
      .eq("category", "expo");

    if (deleteError) {
      console.error("❌ Error deleting existing Expo docs:", deleteError);
      return {
        status: "error",
        message: "Failed to delete existing Expo docs",
      };
    }

    // 2. Get all .mdx files in the sdk directory from GitHub API
    const sdkDirApiUrl =
      "https://api.github.com/repos/expo/expo/contents/docs/pages/versions/v53.0.0/sdk";
    try {
      const dirResponse = await axios.get(sdkDirApiUrl);
      const files = dirResponse.data
        .filter((item: any) => item.name.endsWith(".mdx"))
        .map((item: any) => item.name);

      let totalChunks = 0;
      let errors: string[] = [];

      for (const file of files) {
        // Add 2 second base delay between each file to avoid rate limits
        await delay(2000);
        
        const rawUrl = `https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v53.0.0/sdk/${file}`;
        try {
          const response = await fetchWithRetry(rawUrl);
          const content = response.data;

          const chunks = chunkText(content);
          const { embeddings } = await embedMany({
            model: embeddingModel,
            values: chunks,
          });

          const rows = chunks.map((chunk, i) => ({
            content: chunk,
            embedding: embeddings[i],
            source: file,
            category: "expo",
          }));

          const { error } = await supabase.from("embeddings").insert(rows);
          if (error) throw error;

          totalChunks += rows.length;
        } catch (err: any) {
          console.error(`❌ Error processing ${file}:`, err);
          errors.push(file);
        }
      }

      return {
        status: errors.length === 0 ? "success" : "partial",
        totalFiles: files.length,
        totalChunks,
        failedFiles: errors,
      };
    } catch (error) {
      console.error("❌ Error fetching file list or processing:", error);
      return {
        status: "error",
        message: "Failed to fetch file list or process files",
      };
    }
  },
});
