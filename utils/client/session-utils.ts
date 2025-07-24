export async function updateSessionTitle(
  userMessage: string,
  aiResponse: string,
  sessionId: string,
  callback?: () => void,
) {
  try {
    // 2. Update the session title in the database
    const updateResponse = await fetch(`/api/sessions/title`, {
      method: "PUT",
      body: JSON.stringify({
        sessionId,
        isAiGenerated: true,
        content: userMessage + " " + aiResponse,
      }),
    });

    const data = await updateResponse.json();
    if (!updateResponse.ok) {
      throw new Error("Failed to update title");
    }

    return data.title; // Return the title from the response
  } catch (error) {
    console.error("Error updating session title:", error);
    return null;
  }
}
