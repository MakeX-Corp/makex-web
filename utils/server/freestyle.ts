import { FreestyleSandboxes } from "freestyle-sandboxes";

// Initialize Freestyle Sandboxes client
export function getFreestyleClient() {
  return new FreestyleSandboxes({
    apiKey: process.env.FREESTYLE_API_KEY!,
  });
}

// Create a Git repository
export async function createGitRepository(name?: string) {
  const sandboxes = getFreestyleClient();

  const repoResponse = await (sandboxes as any).createGitRepository({
    name: name,
  });

  return repoResponse;
}

// Grant permission to a Git repository
export async function grantGitPermission({
  identityId,
  repoId,
  permission,
}: {
  identityId: string;
  repoId: string;
  permission: "read" | "write";
}) {
  const sandboxes = getFreestyleClient();

  await (sandboxes as any).grantGitPermission({
    identityId,
    repoId,
    permission,
  });
}

// List Git repositories
export async function listGitRepositories() {
  const sandboxes = getFreestyleClient();

  return await (sandboxes as any).listGitRepositories();
}

// Delete a Git repository
export async function deleteGitRepository(repoId: string) {
  const sandboxes = getFreestyleClient();

  await (sandboxes as any).deleteGitRepository({
    repoId,
  });
}

// Download a zip of a Git repository
export async function downloadGitRepositoryZip(repoId: string, ref?: string) {
  const freestyleApiKey = process.env.FREESTYLE_API_KEY;
  if (!freestyleApiKey) {
    throw new Error("Freestyle API key not configured");
  }

  const url = new URL(`https://api.freestyle.sh/git/v1/repo/${repoId}/zip`);
  if (ref) {
    url.searchParams.set("ref", ref);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${freestyleApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download repository zip: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}

// Deploy web application from Git repository
export async function deployWebFromGit(
  gitRepoId: string,
  domains: string[],
  build: boolean | { envVars?: Record<string, string> } = true
) {
  const sandboxes = getFreestyleClient();

  const deploymentConfig: any = {
    domains,
    build,
  };

  console.log(`[DeployWeb] Deployment config:`, deploymentConfig);

  return await sandboxes.deployWeb(
    {
      kind: "git",
      url: `https://git.freestyle.sh/${gitRepoId}`,
    },
    deploymentConfig
  );
}

// Configure GitHub sync for a Freestyle repository
export async function configureGitHubSync({
  repoId,
  githubRepoName,
}: {
  repoId: string;
  githubRepoName: string;
}) {
  const sandboxes = getFreestyleClient();

  await (sandboxes as any).configureGitRepoGitHubSync({
    repoId,
    githubRepoName,
  });
}

// Remove GitHub sync for a Freestyle repository
export async function removeGitHubSync({ repoId }: { repoId: string }) {
  const sandboxes = getFreestyleClient();

  await (sandboxes as any).removeGitRepoGitHubSync({
    repoId,
  });
}
