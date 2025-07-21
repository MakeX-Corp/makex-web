// create a new e2b container

import { Sandbox } from "@e2b/code-interpreter";

const APP_DIR = "/app/expo-app";

export async function createE2BContainer(metadata: {
  userId: string;
  appId: string;
  appName: string;
}) {
  const sbx = await Sandbox.create(process.env.E2B_TEMPLATE_ID as string, {
    timeoutMs: 3600 * 1000,
    metadata: metadata,
  });

  const appHost = sbx.getHost(8000);
  const apiHost = sbx.getHost(8001);

  return {
    appHost: `https://${appHost}`,
    apiHost: `https://${apiHost}`,
    containerId: sbx.sandboxId,
  };
}

export async function resumeE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.resume(sandboxId, {
    timeoutMs: 3600 * 1000,
  });

  const appHost = sbx.getHost(8000);
  const apiHost = sbx.getHost(8001);

  return {
    appHost: `https://${appHost}`,
    apiHost: `https://${apiHost}`,
  };
}

export async function pauseE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.connect(sandboxId);
  const pausedId = await sbx.pause();
  return pausedId;
}

export async function killE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.kill(sandboxId);
  return sbx;
}

export async function startExpoInContainer(sandboxId: string) {
  const sbx = await Sandbox.connect(sandboxId);

  // Log sandbox ID
  console.log("Connected to sandbox:", sbx.sandboxId);

  const appUrl = `https://${sbx.getHost(8000)}`;
  const apiUrl = `https://${sbx.getHost(8001)}`;

  console.log("App URL:", appUrl);
  console.log("API URL:", apiUrl);

  await sbx.commands.run(
    `sudo EXPO_PACKAGER_PROXY_URL=${appUrl} npx expo start --port 8000 > ~/expo_logs.txt 2>&1 &`,
    {
      background: true,
      cwd: APP_DIR,
      envs: {
        EXPO_PACKAGER_PROXY_URL: appUrl,
      },
    }
  );

  return {
    appUrl,
    apiUrl,
  };
}

export async function killDefaultExpo(sandboxId: string) {
  try {
    const sbx = await Sandbox.connect(sandboxId);
    const port = sbx.getHost(8000);
    console.log("Connected to sandbox:", sbx.sandboxId);

    // Kill all node processes
    try {
      const killResult = await sbx.commands.run(
        "sudo kill -9 $(ps aux | grep node | grep -v grep | awk '{print $2}') 2>/dev/null || true"
      );
      console.log("Kill all node processes result:", killResult);
    } catch (error) {
      console.log("Error during process kill:", error);
    }

    // Verify port is free
    try {
      const checkPort = await sbx.commands.run("sudo lsof -i:8000 || true");
      console.log("Port check result:", checkPort);
    } catch (error) {
      console.log("Port 8000 is free");
    }

    return true;
  } catch (error) {
    console.error("Error in killDefaultExpo:", error);
    throw error;
  }
}



export async function writeConvexConfigInContainer(
  sandboxId: string,
  {
    deploymentName,
    convexUrl,
  }: {
    deploymentName: string;
    convexUrl: string;
  }
) {
  const sbx = await Sandbox.connect(sandboxId);
  const CONFIG_DIR = "/root/.convex";
  const CONFIG_PATH = `${CONFIG_DIR}/config.json`;

  const ENV_FILE = `${APP_DIR}/.env.local`;

  const writeConfigCommand = [
    `sudo mkdir -p ${CONFIG_DIR}`,
    `echo '{ "accessToken": "${process.env.CONVEX_AUTH_TOKEN}" }' | sudo tee ${CONFIG_PATH} > /dev/null`,
    `sudo mkdir -p ${APP_DIR}`,
    `echo -e "CONVEX_DEPLOYMENT=${deploymentName}\\nEXPO_PUBLIC_CONVEX_URL=${convexUrl}" | sudo tee ${ENV_FILE} > /dev/null`,
  ].join(" && ");
  await sbx.commands.run(writeConfigCommand);

  return {
    configWritten: CONFIG_PATH,
    envWritten: ENV_FILE,
  };
}

export async function deployConvexProdInContainer(
  sandboxId: string,
  convexUrl: string,
  gitRepoId: string,
) {
  const sbx = await Sandbox.connect(sandboxId);
  const gitRepoDir = `/app/deploy-app`;

  const gitRepoUrl = `https://${process.env.FREESTYLE_IDENTITY_ID}:${process.env.FREESTYLE_IDENTITY_TOKEN}@git.freestyle.sh/${gitRepoId}`;

  console.log("[ConvexDeploy] Starting deployment in container:", sandboxId);

  const CONFIG_DIR = "/root/.convex";
  const CONFIG_PATH = `${CONFIG_DIR}/config.json`;

  console.log("[ConvexDeploy] Writing Convex config...");
  const writeConfigCommand = [
    `sudo mkdir -p ${CONFIG_DIR}`,
    `echo '{ "accessToken": "${process.env.CONVEX_AUTH_TOKEN}" }' | sudo tee ${CONFIG_PATH} > /dev/null`,
  ].join(" && ");
  await sbx.commands.run(writeConfigCommand);
  console.log("[ConvexDeploy] Convex config written");

  console.log("[ConvexDeploy] Cloning git repo...");
  await sbx.commands.run(`sudo git clone ${gitRepoUrl} ${gitRepoDir}`);
  console.log("[ConvexDeploy] Git repo cloned");

  const convexDeployment = `dev:${new URL(convexUrl).hostname.split(".")[0]}`;

  // set the env vars
  const envFile = `${gitRepoDir}/.env.local`;
  const envCommand = `sudo echo -e "CONVEX_DEPLOYMENT=${convexDeployment}\\nEXPO_PUBLIC_CONVEX_URL=${convexUrl}" | sudo tee ${envFile} > /dev/null`;
  await sbx.commands.run(envCommand);
  console.log("[ConvexDeploy] Env variables set");

  // cat the env file
  const envLogs = await sbx.commands.run(`cat ${envFile}`);
  console.log("[ConvexDeploy] Env file:", envLogs);

  // install convex 
  const installConvexCommand = `sudo npm install -g convex`;
  await sbx.commands.run(installConvexCommand);
  console.log("[ConvexDeploy] Convex installed");

  // run yarn install
  const installPackagesCommand = `sudo yarn install`;
  await sbx.commands.run(installPackagesCommand, {
    cwd: gitRepoDir,
  });
  console.log("[ConvexDeploy] Yarn installed");

  // deploy convex prod
  const deployConvexCommand = `sudo npx convex deploy --yes > ~/convex_prod_logs.txt 2>&1`;
  await sbx.commands.run(deployConvexCommand , {
    cwd: gitRepoDir,
  });

  // cat the logs
  const logs = await sbx.commands.run(`cat ~/convex_prod_logs.txt`);
  console.log("[ConvexDeploy] Convex prod logs:", logs);

  console.log("[ConvexDeploy] Convex deployed");
  
}



export async function startConvexInContainer(sandboxId: string) {
  const sbx = await Sandbox.connect(sandboxId);

  const LOG_FILE = `~/convex_logs.txt`;

  console.log("Starting convex in container...");

  // Step 1: cd into the app directory
  await sbx.commands.run(`cd ${APP_DIR}`);

  // Step 2: run convex dev in background
  await sbx.commands.run(`sudo npx convex dev > ${LOG_FILE} 2>&1 &`, {
    background: true,
    cwd: APP_DIR,
  });

  return {
    startedIn: APP_DIR,
    logFile: LOG_FILE,
  };
}


export async function setupFreestyleGitInContainer(sandboxId: string, repoId: string) {
  const sbx = await Sandbox.connect(sandboxId);

  // Clean up any existing git configuration
  await sbx.commands.run(`sudo rm -rf .git || true`, {
    cwd: APP_DIR,
  });

  // Initialize git repository if it doesn't exist
  const initResult = await sbx.commands.run(`sudo git init`, {
    cwd: APP_DIR,
  });

  // Configure git user (required for commits)
  await sbx.commands.run(`sudo git config user.name "MakeX Bot" && sudo git config user.email "bot@makex.app"`, {
    cwd: APP_DIR,
  });

  // Add all files to git
  const addResult = await sbx.commands.run(`sudo git add .`, {
    cwd: APP_DIR,
  });

  // Create initial commit if there are changes
  const commitResult = await sbx.commands.run(`sudo git commit -m "Initial commit" || true`, {
    cwd: APP_DIR,
  });

  // Add freestyle remote
  const remoteAddResult = await sbx.commands.run(`sudo git remote add freestyle https://${process.env.FREESTYLE_IDENTITY_ID}:${process.env.FREESTYLE_IDENTITY_TOKEN}@git.freestyle.sh/${repoId}`,
    {
      cwd: APP_DIR,
    }
  );

  // Create main branch and push to master
  const pushResult = await sbx.commands.run(`sudo git push freestyle master`, {
    cwd: APP_DIR,
  });

  return {
    initResult,
    addResult,
    commitResult,
    remoteAddResult,
    pushResult,
  };
}