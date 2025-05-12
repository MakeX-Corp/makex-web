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
  const sbx = await Sandbox.connect(sandboxId)
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
  console.log('Connected to sandbox:', sbx.sandboxId);

  const appUrl = `https://${sbx.getHost(8000)}`;
  const apiUrl = `https://${sbx.getHost(8001)}`;

  console.log('App URL:', appUrl);
  console.log('API URL:', apiUrl);

  await sbx.commands.run(
    `sudo EXPO_PACKAGER_PROXY_URL=${appUrl} npx expo start --port 8000 > ~/expo_logs.txt 2>&1 &`,
    { 
      background: true,
      cwd: '/app/expo-app',
      envs: {
        EXPO_PACKAGER_PROXY_URL: appUrl
      }
    }
  );
  
  return {
    appUrl,
    apiUrl
  };
}


export async function killDefaultExpo(sandboxId: string) {
  try {
    const sbx = await Sandbox.connect(sandboxId);
    const port = sbx.getHost(8000);
    console.log('Connected to sandbox:', sbx.sandboxId);


    return
    // Kill the main expo process
    try {
      // Get the PID of the main expo process
      const findPid = await sbx.commands.run('ps aux | grep "node /app/expo-app/node_modules/.bin/expo start --port 8000" | grep -v grep | awk \'{print $2}\'');
      console.log('Found main expo PID:', findPid.stdout);

      if (findPid.stdout) {
        const pid = findPid.stdout.trim();
        const killResult = await sbx.commands.run(`sudo kill -9 ${pid}`);
        console.log(`Killed main expo process ${pid}:`, killResult);
      } else {
        console.log('No main expo process found');
      }
    } catch (error) {
      console.log('Error during process kill:', error);
    }

    // Verify port is free
    try {
      const checkPort = await sbx.commands.run('sudo lsof -i:8000 || true');
      console.log('Port check result:', checkPort);
    } catch (error) {
      console.log('Port 8000 is free');
    }

    return true;
  } catch (error) {
    console.error('Error in killDefaultExpo:', error);
    throw error;
  }
}

