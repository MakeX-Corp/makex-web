// Function to update app name
export const updateAppName = async (
  appId: string,
  newName: string,
  authToken: string | null
): Promise<boolean> => {
  try {
    if (!authToken) {
      console.error("No auth token available");
      return false;
    }

    const response = await fetch("/api/app", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        appId,
        displayName: newName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update app name: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error updating app name:", error);
    return false;
  }
};
