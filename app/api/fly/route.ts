import { NextResponse } from 'next/server';
import axios from 'axios';

const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
const FLY_API_URL = 'https://api.fly.io/graphql';
const FLY_MACHINES_API = 'https://api.machines.dev/v1';

const createAppMutation = `
  mutation($name: String!, $orgId: ID!) {
    createApp(input: {name: $name, organizationId: $orgId}) {
      app {
        id
        name
      }
    }
  }
`;

const allocateIpv4Mutation = `
  mutation($appId: ID!) {
    allocateIpAddress(input: { appId: $appId, type: v4 }) {
      ipAddress {
        id
        address
      }
    }
  }
`;

async function createMachine(appName: string, config: any) {
  const url = `${FLY_MACHINES_API}/apps/${appName}/machines`;
  console.log(`Creating machine at URL: ${url}`);

  try {
    const response = await axios.post(
      url,
      config,
      {
        headers: {
          'Authorization': `Bearer ${FLY_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Machine creation error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    throw error;
  }
}

async function createMachines(appName: string, config: any, count: number) {
  const machines = [];
  for (let i = 0; i < count; i++) {
    const machineName = `${appName}-machine-${i + 1}`;
    console.log(`Creating machine: ${machineName}`);
    const response = await createMachine(appName, {
      ...config,
      name: machineName
    });
    machines.push(response.data);
  }
  return machines;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appName = body.name;

    if (!appName || !/^[a-z0-9][a-z0-9-]{0,49}$/.test(appName)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid app name. Must be lowercase alphanumeric with hyphens, max 50 chars, starting with letter/number'
        },
        { status: 400 }
      );
    }

    console.log('Environment Variables:', {
      hasToken: !!FLY_API_TOKEN,
      hasOrgId: !!process.env.FLY_ORG_ID,
      orgId: process.env.FLY_ORG_ID
    });

    // Step 1: Create the app
    console.log(`Creating app: ${appName}`);
    const appResponse = await axios.post(
      FLY_API_URL,
      {
        query: createAppMutation,
        variables: {
          name: appName,
          orgId: process.env.FLY_ORG_ID
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${FLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (appResponse.data.errors) {
      const errorMsg = appResponse.data.errors[0]?.message;
      if (errorMsg?.includes('already exists') || errorMsg?.includes('already taken')) {
        return NextResponse.json({
          success: false,
          error: `App name "${appName}" is already taken. Please try a different name.`
        }, { status: 409 });
      }
      return NextResponse.json({
        success: false,
        error: errorMsg || 'Failed to create app',
        details: appResponse.data.errors
      }, { status: 400 });
    }

    // After successful app creation, allocate IPv4
    const appId = appResponse.data?.data?.createApp?.app?.id;
    if (!appId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get app ID from response',
        response: appResponse.data
      }, { status: 500 });
    }

    // Allocate IPv4 address
    console.log(`Allocating IPv4 for app: ${appName}`);
    const ipResponse = await axios.post(
      FLY_API_URL,
      {
        query: allocateIpv4Mutation,
        variables: {
          appId: appId
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${FLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (ipResponse.data.errors) {
      console.error('IP allocation error:', ipResponse.data.errors);
    }

    // Step 2: Create two machines
    console.log(`Creating machines for app: ${appName}`);
    const machineConfig = {
      config: {
        image: 'tkejr/expo-fast:latest',
        services: [
          {
            protocol: 'tcp',
            internal_port: 8000,
            auto_stop_machines: "stop",
            auto_start_machines: true,
            min_machines_running: 0,
            max_machines_running: 1,
            ports: [
              { port: 80, handlers: ['http'] },
              { port: 443, handlers: ['tls', 'http'] }
            ]
          },
          {
            protocol: 'tcp',
            internal_port: 8001,
            ports: [
              { port: 8001, handlers: ['tls','http'] }
            ]
          }
        ],
        env: {
          PORT: '8000',
          EXPO_PACKAGER_PROXY_URL: `http://${appName}.fly.dev`
        },
        guest: {
          cpu_kind: 'shared',
          cpus: 2,
          memory_mb: 2048  // This is equivalent to '2gb' in the toml
        }
      },
    };

    const machines = await createMachines(appName, machineConfig, 2);

    return NextResponse.json({
      success: true,
      machines,
      ip: ipResponse.data?.data?.allocateIpAddress?.ipAddress
    });
  } catch (error) {
    console.error('Error deploying container:', error);

    // Improve error handling for Axios errors
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.error ||
        error.message;

      return NextResponse.json(
        {
          success: false,
          error: errorMessage
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deploy container'
      },
      { status: 500 }
    );
  }
} 