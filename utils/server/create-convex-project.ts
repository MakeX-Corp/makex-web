export async function createConvexProject({
  projectName,
  teamSlug,
  apiKey,
}: {
  projectName: string;
  teamSlug: string;
  apiKey: string;
}) {
  const response = await fetch(
    "https://api.convex.dev/api/dashboard/create_project",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Convex-Client": "makex-server-1.0.0",
      },
      body: JSON.stringify({
        projectName,
        team: teamSlug,
        deploymentType: "dev",
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
