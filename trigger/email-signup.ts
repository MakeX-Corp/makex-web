import { task } from "@trigger.dev/sdk/v3";

export const waitlistRegistration = task({
  id: "email-signup",
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: { email: string }) => {
    try {
      // Register with Loops.so
      const loopsResponse = await fetch(
        "https://app.loops.so/api/v1/contacts/create",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: payload.email,
            source: "waitlist",
            subscribed: true,
          }),
        },
      );

      if (!loopsResponse.ok) {
        console.error(
          "Failed to register with Loops.so:",
          await loopsResponse.text(),
        );
        throw new Error("Failed to register with email service");
      }

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
});
