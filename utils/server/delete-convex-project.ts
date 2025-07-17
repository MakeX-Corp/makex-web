export async function deleteConvexProject({
  projectSlug,
  apiKey,
}: {
  projectSlug: string;
  apiKey: string;
}) {
  const response = await fetch(
    "https://api.convex.dev/api/dashboard/delete_project",
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Convex-Client": "makex-server-1.0.0",
      },
      body: JSON.stringify({
        projectSlug,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `[createConvexProject] Failed: ${response.status} ${errorBody}`
    );
  }

  return response.json(); // contains projectSlug, adminKey, prodUrl, etc.
}
