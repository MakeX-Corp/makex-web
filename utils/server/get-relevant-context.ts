import { createClient } from "@supabase/supabase-js";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabase } from "@/utils/supabase/basic";

interface EmbeddingRow {
  content: string;
  source?: string;
  category?: string;
}

export async function getRelevantContext(
  query: string,
  limit = 5,
  category: string,
) {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });

  if (!embedding) {
    console.error("❌ Failed to create embedding for query");
    return [];
  }

  const { data, error } = await supabase.rpc("match_embeddings", {
    query_embedding: embedding,
    match_threshold: 0.4,
    match_count: limit,
    category_filter: category,
  });

  if (error) {
    console.error("❌ Supabase RPC error:", error);
    return [];
  }

  return data.map((row: EmbeddingRow) => row.content);
}
