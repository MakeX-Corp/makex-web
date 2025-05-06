import { Daytona, SandboxResources, Sandbox } from '@daytonaio/sdk';

const resources: SandboxResources = {
  cpu: 4,
  memory: 4,
  disk: 5,
}

const daytona = new Daytona({
  apiKey: process.env.DAYTON_API_KEY,
});

async function startProcesses(container: any) {
  // Create a session for executing commands
  const sessionId = 'main-session';
  await container.process.createSession(sessionId);

  // Execute initialization script
  const initResult = await container.process.executeSessionCommand(sessionId, {
    command: 'cd /app && ./init.sh'
  });
  console.log('init.sh result:', initResult);

  // Get preview links for the ports
  const apiPreview = await container.getPreviewLink(8001);
  const appPreview = await container.getPreviewLink(8000);
  console.log('API Preview URL:', apiPreview.url);
  console.log('App Preview URL:', appPreview.url);

  // Start expo server
  console.log('Starting expo server...');
  const expoCommand = `cd /app/expo-app && export EXPO_PACKAGER_PROXY_URL=${appPreview.url} && yarn expo start --port 8000 > expo.log 2>&1 &`;
  const expoResult = await container.process.executeSessionCommand(sessionId, {
    command: expoCommand,
    async: true
  }, 30); // 30 second timeout
  console.log('expo start result:', expoResult);


  return {
    sessionId,
    apiPreview,
    appPreview
  };
}

export async function createDaytonaContainer(metadata: {
  userId: string;
  appId: string;
  appName: string;
}) {
  const container = await daytona.create({
    image: 'harbor-transient.internal.daytona.app/daytona/makex-backend:0.1.4',
    resources: resources,
    autoStopInterval: 60,
    public: true,
  });


  console.log('Container created', await container.info());

  await container.setLabels(metadata);

  // Start all processes
  const processInfo = await startProcesses(container);
  return {
    container,
    ...processInfo
  };
}


export async function resumeDaytonaContainer(sandboxId: string) {
  const container = await daytona.get(sandboxId);

  const containerInfo = await container.info();

  if (containerInfo.state == 'stopped') {
    await container.start();
    const processInfo = await startProcesses(container);
    return {
      container,
      ...processInfo
    };
  }

  const processInfo = {
    apiPreview: await container.getPreviewLink(8001),
    appPreview: await container.getPreviewLink(8000),
  }

  // Start all processes
  return {
    container,
    ...processInfo
  };
}

export async function pauseDaytonaContainer(sandboxId: string) {
  const container = await daytona.get(sandboxId);
  const containerInfo = await container.info(); 
  if (containerInfo.state == 'started') {
    await container.stop();
  }
  return container;
}

export async function killDaytonaContainer(sandboxId: string) {
  const container = await daytona.get(sandboxId);
  await daytona.remove(container);
}
