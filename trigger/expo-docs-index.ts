import { schedules } from "@trigger.dev/sdk";
import axios from "axios";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabase } from "@/utils/supabase/basic";
import { python } from "@trigger.dev/python";

const embeddingModel = openai.textEmbeddingModel("text-embedding-3-small");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchExpoDocs = schedules.task({
  id: "fetch-expo-docs",

  cron: "0 0 * * 0",
  run: async () => {
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
        await delay(2000);

        const rawUrl = `https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v53.0.0/sdk/${file}`;
        try {
          const result = await python.runScript("./python/chunk-runner.py", [
            rawUrl,
            "code",
            "typescript",
          ]);
          const chunks = JSON.parse(result.stdout);
          console.log(
            `[ExpoDocs] Python chunker produced ${chunks.length} chunks for ${file}`,
          );
          chunks.forEach((chunk: any, idx: number) => {
            console.log(`[ExpoDocs] Chunk ${idx + 1}:`, JSON.stringify(chunk));
          });

          const batchSize = 50;
          for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            console.log(
              `[ExpoDocs] Processing batch ${i / batchSize + 1}: ${
                batch.length
              } chunks for ${file}`,
            );

            const texts = batch.map((chunk: { text: string }) => chunk.text);
            const { embeddings } = await embedMany({
              model: embeddingModel,
              values: texts,
            });
            console.log(
              `[ExpoDocs] Got ${embeddings.length} embeddings for batch ${
                i / batchSize + 1
              } of ${file}`,
            );

            const rows = batch.map((chunk: { text: string }, j: number) => ({
              content: chunk.text,
              embedding: embeddings[j],
              source: file,
              category: "expo",
            }));
            console.log(
              `[ExpoDocs] Inserting ${rows.length} rows into DB for batch ${
                i / batchSize + 1
              } of ${file}`,
            );

            const { error } = await supabase.from("embeddings").insert(rows);
            if (error) throw error;

            totalChunks += rows.length;

            if (i + batchSize < chunks.length) {
              await delay(1000);
            }
          }
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
