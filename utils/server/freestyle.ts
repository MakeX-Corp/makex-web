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

// Deploy web application from Git repository
export async function deployWebFromGit(
  gitRepoId: string,
  domains: string[],
  build: boolean = true
) {
  const sandboxes = getFreestyleClient();
  
  return await sandboxes.deployWeb(
    {
      kind: "git",
      url: `https://git.freestyle.sh/${gitRepoId}`,
    },
    {
      domains,
      build,
    }
  );
}
