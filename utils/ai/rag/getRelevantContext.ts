import { createClient } from "@supabase/supabase-js";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabase } from "@/utils/supabase/basic";

export async function getRelevantContext(query: string, limit = 5) {
    // Step 1: Generate embedding for the query
    const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: query,
    });

    if (!embedding) {
        console.error("❌ Failed to create embedding for query");
        return [];
    }

    // Step 2: Query Supabase for similar embeddings
    const { data, error } = await supabase
        .from("embeddings")
        .select("content, source")
        .order(
            `embedding <#> '[${embedding.join(",")}]'::vector`,
            { ascending: true }
        )
        .limit(limit);

    if (error) {
        console.error("❌ Supabase vector query error:", error);
        return [];
    }

    return data.map((row) => row.content); // Return only the content for context injection
}
