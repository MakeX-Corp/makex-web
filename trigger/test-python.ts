import { task } from "@trigger.dev/sdk";
import { python } from "@trigger.dev/python";

export const myScript = task({
  id: "my-python-script",
  retry: {
    maxAttempts: 0,
  },
  run: async () => {
    const rawUrl =
      "https://raw.githubusercontent.com/openai/openai-openapi/manual_spec/openapi.yaml";

    const result = await python.runScript("./python/chunk-runner.py", [
      rawUrl,
      "code",
      "yaml",
    ]);
    const chunks = JSON.parse(result.stdout);
    return {
      totalChunks: chunks.length,
      preview: chunks.slice(0, 2), // show first 2
    };
  },
});
