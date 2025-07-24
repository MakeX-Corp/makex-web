import { Daytona, SandboxResources, Sandbox } from "@daytonaio/sdk";

const resources: SandboxResources = {
  cpu: 4,
  memory: 4,
  disk: 5,
};

const daytona = new Daytona({
  apiKey: process.env.DAYTON_API_KEY,
  apiUrl: process.env.DAYTON_API_URL,
  target: "us",
});

async function startFastAPI(container: any, sessionId: string) {
  // Execute initialization script
  const initResult = await container.process.executeSessionCommand(sessionId, {
    command: "cd /app && ./init.sh",
  });
  console.log("init.sh result:", initResult);

  // Get preview link for the API
  const apiPreview = await container.getPreviewLink(8001);
  console.log("API Preview URL:", apiPreview.url);

  return apiPreview;
}

async function startExpo(container: any, sessionId: string, appPreview: any) {
  // Start expo server
  const expoCommand = `cd /app/expo-app && export EXPO_PACKAGER_PROXY_URL=${appPreview.url} && yarn expo start --port 8000 > expo.log 2>&1 &`;
  const expoResult = await container.process.executeSessionCommand(
    sessionId,
    {
      command: expoCommand,
      async: true,
    },
    30
  ); // 30 second timeout
  console.log("expo start result:", expoResult);

  return expoResult;
}

export async function initiateDaytonaContainer() {
  const container = await daytona.create({
    image: "harbor-transient.internal.daytona.app/daytona/makex-backend:0.1.4",
    resources: resources,
    autoStopInterval: 60,
    public: true,
  });

  const sessionId = "fast-api-session";
  await container.process.createSession(sessionId);
  await startFastAPI(container, sessionId);
  const apiPreview = await container.getPreviewLink(8001);

  // start the fastapi process
  return {
    containerId: container.id,
    apiUrl: apiPreview.url,
  };
}

export async function startExpoInContainer(containerId: string) {
  const container = await daytona.get(containerId);

  const sessionId = "expo-session";
  await container.process.createSession(sessionId);

  const appPreview = await container.getPreviewLink(8000);
  const apiPreview = await container.getPreviewLink(8001);
  console.log("App Preview URL:", appPreview.url);
  console.log("API Preview URL:", apiPreview.url);

  const expoResult = await startExpo(container, sessionId, appPreview);

  console.log("expo start result:", expoResult);

  return {
    appPreview: appPreview.url,
    apiPreview: apiPreview.url,
  };
}

export async function initiateResumeDaytonaContainer(sandboxId: string) {
  const container = await daytona.get(sandboxId);
  const containerInfo = await container.info();

  if (containerInfo.state == "stopped") {
    await container.start();
    const sessionId = "fast-api-session";
    await container.process.createSession(sessionId);
    const fastApiResult = await startFastAPI(container, sessionId);
    return {
      apiPreview: fastApiResult.url,
    };
  }
}

export async function pauseDaytonaContainer(sandboxId: string) {
  const container = await daytona.get(sandboxId);
  const containerInfo = await container.info();
  if (containerInfo.state == "started") {
    await container.stop();
  }
  return {
    containerInfo,
  };
}

export async function killDaytonaContainer(sandboxId: string) {
  const container = await daytona.get(sandboxId);

  const containerInfo = await container.info();

  if (containerInfo.state == "destroyed") {
    return {
      containerInfo,
    };
  }

  // if the container is running, stop itcn
  if (containerInfo.state == "started") {
    await container.stop();
  }

  await daytona.remove(container);

  return {
    containerInfo,
  };
}
