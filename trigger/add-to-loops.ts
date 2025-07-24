import { task } from "@trigger.dev/sdk/v3";

export const addToLoops = task({
  id: "add-to-loops",
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: { email: string }) => {
    console.log(process.env.LOOPS_API_KEY);
    try {
      const apiKey = process.env.LOOPS_API_KEY?.trim();

      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          subscribed: true,
          source: "signup",
          mailingLists: {},
        }),
      };

      const response = await fetch("https://app.loops.so/api/v1/contacts/create", options);

      if (!response.ok) {
        throw new Error(`Failed to add to Loop.so: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Successfully added to Loop.so:", result);
      return result;
    } catch (error) {
      console.error("Error in addToLoops task:", error);
      throw error;
    }
  },
});
