// create a new e2b container

import { Sandbox } from "@e2b/code-interpreter";

export async function createE2BContainer(metadata: {
  userId: string;
  appId: string;
  appName: string;
}) {
  const sbx = await Sandbox.create(process.env.E2B_TEMPLATE_ID as string, {
    timeoutMs: 3600*1000,
    metadata: metadata,
  });

  const appHost = sbx.getHost(8000);
  const apiHost = sbx.getHost(8001);

  return {
    appHost,
    apiHost,
    sbx,
  };
}

export async function createE2BContainerClaude(metadata: {
  userId: string;
  appId: string;
  appName: string;
}) {
  const sbx = await Sandbox.create(process.env.E2B_TEMPLATE_ID as string, {
    timeoutMs: 3600*1000,
    metadata: metadata,
  });

  await sbx.files.write('/home/user/.claude.json', JSON.stringify({
    "userID": "d8eb97302a3997e5e4101d25ae7daaabd597f1cb76e416d477c394c594a5c5d8",
    "bypassPermissionsModeAccepted": true
  }));

  await sbx.commands.run("sudo chown user:user -R /app/expo-app")
  

  const appHost = sbx.getHost(8000);
  const apiHost = sbx.getHost(8001);

  console.log('sandbox created', sbx.sandboxId);


  const output = await sbx.commands.run(`export EXPO_PACKAGER_PROXY_URL=https://${appHost} && yarn expo start --port 8000  > ~/expo_logs.txt 2>&1`, {
    background: true,
    cwd: '/app/expo-app'
  });

  console.log('output', output);
  
  // Configure Git to trust the repository directory
  return {
    appHost,
    apiHost,
    sbx,
  };
}

export async function resumeE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.resume(sandboxId, {
    timeoutMs: 3600*1000,
  });
  
  const appHost = sbx.getHost(8000);
  const apiHost = sbx.getHost(8001);

  return {
    appHost,
    apiHost,
  };
}

export async function pauseE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.resume(sandboxId, {
    timeoutMs: 3600*1000,
  });
  const pausedId = await sbx.pause();
  return pausedId;
}


export async function killE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.kill(sandboxId);
  return sbx;
}
  