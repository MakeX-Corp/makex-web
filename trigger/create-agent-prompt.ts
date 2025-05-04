import { task } from "@trigger.dev/sdk/v3";

export const createAgentPrompt = task({
  id: "create-agent-prompt",
  retry: {
    maxAttempts: 1
  },
  run: async (payload: { prompt: string; baseUrl: string }) => {
    const { prompt, baseUrl } = payload;

    const res = await fetch(`${baseUrl}/claude`, {
      method: "POST",
      headers: {
        "X-API-Key": "JCFQeB0lVMmaRejapxNeh4YvkzLogYmj",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }

    const text = await res.text();
    return { response: text };
  },
});
