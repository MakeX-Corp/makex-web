import { schedules } from "@trigger.dev/sdk";
import axios from "axios";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabase } from "@/utils/supabase/basic"; // update path as needed
import { python } from "@trigger.dev/python";

const embeddingModel = openai.textEmbeddingModel("text-embedding-3-small");

function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// Add delay function with exponential backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Add retry function with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3) {
  let retries = 0;
  while (true) {
    try {
      return await axios.get(url);
    } catch (error: any) {
      if (error.response?.status === 429 && retries < maxRetries) {
        const backoffTime = Math.pow(2, retries) * 2000; // 2s, 4s, 8s
        console.log(`Rate limited, retrying in ${backoffTime / 1000}s...`);
        await delay(backoffTime);
        retries++;
        continue;
      }
      throw error;
    }
  }
}

export const fetchConvexDocs = schedules.task({
  id: "fetch-convex-docs",
  // Run every Sunday at 1am UTC
  cron: "0 1 * * 0",
  run: async (payload) => {
    console.log("[ConvexDocs] Task started");
    // 1. Delete existing Convex docs
    const { error: deleteError } = await supabase
      .from("embeddings")
      .delete()
      .eq("category", "convex");

    if (deleteError) {
      console.error("❌ Error deleting existing Convex docs:", deleteError);
      return {
        status: "error",
        message: "Failed to delete existing Convex docs",
      };
    }
    console.log("[ConvexDocs] Existing Convex docs deleted");

    // 2. Fetch the Convex llms.txt file
    const rawUrl = "https://www.convex.dev/llms.txt";
    try {
      // Use Python script for contextual chunking
      const result = await python.runScript("./python/chunk-runner.py", [
        rawUrl,
      ]);
      const chunks = JSON.parse(result.stdout);
      console.log(
        `[ConvexDocs] Python chunker produced ${chunks.length} chunks`,
      );
      chunks.forEach((chunk: string, idx: number) => {
        console.log(`[ConvexDocs] Chunk ${idx + 1}:`, JSON.stringify(chunk));
      });

      // Process embeddings in batches to avoid token limit
      const batchSize = 50; // Process 50 chunks at a time
      let totalChunks = 0;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        console.log(
          `[ConvexDocs] Processing batch ${i / batchSize + 1}: ${
            batch.length
          } chunks`,
        );

        const texts = batch.map((chunk: { text: string }) => chunk.text);
        const { embeddings } = await embedMany({
          model: embeddingModel,
          values: texts,
        });
        console.log(
          `[ConvexDocs] Got ${embeddings.length} embeddings for batch ${
            i / batchSize + 1
          }`,
        );

        const rows = batch.map((chunk: { text: string }, j: number) => ({
          content: chunk.text,
          embedding: embeddings[j],
          source: "llms.txt",
          category: "convex",
        }));
        console.log(
          `[ConvexDocs] Inserting ${rows.length} rows into DB for batch ${
            i / batchSize + 1
          }`,
        );

        const { data, error } = await supabase.from("embeddings").insert(rows);
        console.log("[ConvexDocs] Inserted rows:", data);
        if (error) {
          console.error(
            `[ConvexDocs] Error inserting batch ${i / batchSize + 1}:`,
            error,
          );
          throw error;
        }

        totalChunks += rows.length;
        console.log(
          `[ConvexDocs] Inserted batch ${
            i / batchSize + 1
          }, total inserted: ${totalChunks}`,
        );

        // Add small delay between batches to avoid rate limits
        if (i + batchSize < chunks.length) {
          await delay(1000);
        }
      }

      console.log(
        `[ConvexDocs] All batches complete. Total chunks inserted: ${totalChunks}`,
      );
      return {
        status: "success",
        totalChunks: totalChunks,
      };
    } catch (error) {
      console.error("❌ Error fetching or processing Convex llms.txt:", error);
      return {
        status: "error",
        message: "Failed to fetch or process Convex llms.txt",
      };
    }
  },
});
