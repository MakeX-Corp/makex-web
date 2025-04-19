export async function updateSessionTitle(
  userMessage: string,
  aiResponse: string,
  sessionId: string,
  authToken: string,
  callback?: () => void
) {
  try {
    // 2. Update the session title in the database
    const updateResponse = await fetch(`/api/sessions/title`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        sessionId,
        isAiGenerated: true,
        content: userMessage + " " + aiResponse,
      }),
    });
    if (!updateResponse.ok) {
      throw new Error("Failed to update title");
    }

    // 2. Execute the callback if provided to update UI in parent component
    if (callback && typeof callback === "function") {
      callback();
    }
  } catch (error) {
    console.error("Error updating session title:", error);
    return null;
  }
}
