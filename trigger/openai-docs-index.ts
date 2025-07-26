import { schedules } from "@trigger.dev/sdk/v3";
import axios from "axios";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabase } from "@/utils/supabase/basic"; // update path as needed
import { python } from "@trigger.dev/python";
import { encoding_for_model } from "tiktoken";

const enc = encoding_for_model("text-embedding-3-small"); // or "gpt-3.5-turbo", etc.

function sanitizeText(text: string): string {
  // Remove all occurrences of <|endoftext|>
  return text.replace(/<\|endoftext\|>/g, "");
}

function countTokens(text: string): number {
  return enc.encode(text).length;
}

const embeddingModel = openai.textEmbeddingModel("text-embedding-3-small");

// Add delay function with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchOpenAIDocs = schedules.task({
  id: "fetch-openai-docs",
  // Run every Sunday at midnight UTC
  cron: "0 0 * * 0",
  run: async (payload) => {
    console.log("[OpenAIDocs] Task started");
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
    console.log("[OpenAIDocs] Existing OpenAI docs deleted");

    // 2. Fetch the OpenAPI YAML file
    const rawUrl = "https://raw.githubusercontent.com/openai/openai-openapi/manual_spec/openapi.yaml";
    try {
      // Use Python script for contextual chunking
      const result = await python.runScript("./python/chunk-runner.py", [rawUrl,'code','yaml']);
      const chunks = JSON.parse(result.stdout);
      console.log(`[OpenAIDocs] Python chunker produced ${chunks.length} chunks`);
      chunks.forEach((chunk: string, idx: number) => {
        console.log(`[OpenAIDocs] Chunk ${idx + 1}:`, JSON.stringify(chunk));
      });

      // Log chunks that exceed the OpenAI embedding model's token limit
      const MAX_TOKENS = 8192;
      // Filter out chunks that exceed the token limit
      const filteredChunks = chunks.filter((chunk: { text: string }, idx: number) => {
        const sanitized = sanitizeText(chunk.text);
        const tokenCount = countTokens(sanitized);
        if (tokenCount > MAX_TOKENS) {
          console.warn(`[OpenAIDocs] Chunk ${idx + 1} exceeds ${MAX_TOKENS} tokens: ${tokenCount} tokens. Skipping.`);
          return false;
        }
        return true;
      });
      
      // Process embeddings in batches to avoid token limit
      const batchSize = 50; // Process 50 chunks at a time
      let totalChunks = 0;
      
      for (let i = 0; i < filteredChunks.length; i += batchSize) {
        const batch = filteredChunks.slice(i, i + batchSize);
        console.log(`[OpenAIDocs] Processing batch ${i / batchSize + 1}: ${batch.length} chunks`);
        
        const texts = batch.map((chunk: { text: string }) => sanitizeText(chunk.text));
        const { embeddings } = await embedMany({
          model: embeddingModel,
          values: texts,
        });
        console.log(`[OpenAIDocs] Got ${embeddings.length} embeddings for batch ${i / batchSize + 1}`);

        const rows = batch.map((chunk: { text: string }, j: number) => ({
          content: sanitizeText(chunk.text),
          embedding: embeddings[j],
          source: "openapi.yaml",
          category: "openai",
        }));
        console.log(`[OpenAIDocs] Inserting ${rows.length} rows into DB for batch ${i / batchSize + 1}`);

        const { data, error } = await supabase.from("embeddings").insert(rows);
        console.log('[OpenAIDocs] Inserted rows:', data);
        if (error) {
          console.error(`[OpenAIDocs] Error inserting batch ${i / batchSize + 1}:`, error);
          throw error;
        }
        
        totalChunks += rows.length;
        console.log(`[OpenAIDocs] Inserted batch ${i / batchSize + 1}, total inserted: ${totalChunks}`);
        
        // Add small delay between batches to avoid rate limits
        if (i + batchSize < filteredChunks.length) {
          await delay(1000);
        }
      }

      console.log(`[OpenAIDocs] All batches complete. Total chunks inserted: ${totalChunks}`);
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
