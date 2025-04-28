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
  