export async function createConvexProject({
  projectName,
  teamSlug,
}: {
  projectName: string;
  teamSlug: string;
}) {
  const response = await fetch(
    "https://api.convex.dev/api/dashboard/create_project",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CONVEX_AUTH_TOKEN}`,
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

export async function deleteConvexProject({
  projectId,
}: {
  projectId: string;
}) {
  const response = await fetch(
    `https://api.convex.dev/api/dashboard/delete_project/${projectId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CONVEX_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "Convex-Client": "makex-server-1.0.0",
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `[deleteConvexProject] Failed: ${response.status} ${errorBody}`
    );
  }
  return { success: true };
}
