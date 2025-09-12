export const updateAppName = async (
  appId: string,
  newName: string,
): Promise<boolean> => {
  try {
    const response = await fetch("/api/app", {
      method: "PATCH",
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
