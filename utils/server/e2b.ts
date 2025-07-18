// create a new e2b container

import { Sandbox } from "@e2b/code-interpreter";

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
    `sudo EXPO_NO_SIGN_REQUESTS=1 EXPO_OFFLINE=true EXPO_PACKAGER_PROXY_URL=${appUrl} npx expo start --port 8000 > ~/expo_logs.txt 2>&1 &`,
    {
      background: true,
      cwd: "/app/expo-app",
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

  const APP_DIR = "/app/expo-app";
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

export async function startConvexInContainer(sandboxId: string) {
  const sbx = await Sandbox.connect(sandboxId);

  const APP_DIR = "/app/expo-app";
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
