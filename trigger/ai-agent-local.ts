import { task } from "@trigger.dev/sdk/v3";
import { generateText, type Message } from "ai";
import { createTools } from "@/utils/server/tool-factory";
import { getPrompt } from "@/utils/server/prompt";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { getBedrockClient } from "@/utils/server/bedrock-client";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";
import fs from "fs/promises";
import path from "path";

const LOG_PREFIX = "[AI Agent Local]";
const LOCAL_API_URL = "http://localhost:8081"; //replace with ngrok url in local testing

export const aiAgentLocal = task({
  id: "ai-agent-local",
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: { userPrompt: string; images?: string[] }) => {
    try {
      const { userPrompt, images = [] } = payload;

      const apiClient = createFileBackendApiClient(LOCAL_API_URL);

      // Step 1: GET /file-tree
      const fileTree = await apiClient.get("/file-tree", { path: "." });
      await fs.writeFile(
        path.join(process.cwd(), "file-tree-before.json"),
        JSON.stringify(fileTree, null, 2)
      );
      console.log(`${LOG_PREFIX} Wrote file-tree-before.json`);

      // Step 2: Generate text
      const bedrock = getBedrockClient();
      const model = bedrock(CLAUDE_SONNET_4_MODEL);
      const tools = createTools({ apiUrl: LOCAL_API_URL });

      const messages: Message[] = [
        {
          role: "user",
          content: userPrompt,
          id: crypto.randomUUID(),
        },
      ];

      const result = await generateText({
        model,
        messages,
        tools,
        system: getPrompt(fileTree),
        maxSteps: 50,
      });

      console.log(`${LOG_PREFIX} Claude Response:`, result.text);

      // Step 3: Save checkpoint
      const checkpoint = await apiClient.post("/checkpoint/save", {
        name: "ai-assistant-checkpoint",
        message: "Checkpoint after AI assistant changes",
      });

      console.log(`${LOG_PREFIX} Checkpoint:`, checkpoint);

      // Step 4: GET updated file tree
      const updatedFileTree = await apiClient.get("/file-tree", { path: "." });
      await fs.writeFile(
        path.join(process.cwd(), "file-tree-after.json"),
        JSON.stringify(updatedFileTree, null, 2)
      );
      console.log(`${LOG_PREFIX} Wrote file-tree-after.json`);

      return {
        response: result.text,
        checkpoint: checkpoint.commit || checkpoint.current_commit,
      };
    } catch (err) {
      console.error(`${LOG_PREFIX} Error:`, err);
      throw err;
    }
  },
});
