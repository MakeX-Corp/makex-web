import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

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

async function createVolume(appName: string, region: string) {
    const url = `${FLY_MACHINES_API}/apps/${appName}/volumes`;
    
    try {
        const response = await axios.post(
            url,
            {
                name: "data",
                region: region,
                size_gb: 2
            },
            {
                headers: {
                    'Authorization': `Bearer ${FLY_API_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Volume creation error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    }
}

export const maxDuration = 300; // 5 minutes timeout

export async function GET(request: Request) {
    // Add authorization check
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV == 'production') {
        return NextResponse.json({ 
            success: false, 
            error: 'Unauthorized' 
        }, { status: 401 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        // Check current count
        const { data: containers, error } = await supabase
            .from('available_containers')
            .select('*');

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch containers from database'
            }, { status: 500 });
        }

        const currentCount = containers?.length || 0;
        const neededContainers = parseInt(process.env.MAX_CONTAINERS || '10') - currentCount;

        if (neededContainers <= 0) {
            return NextResponse.json({
                success: true,
                message: 'Container count is at target',
                currentCount
            });
        }

        let totalCreated = 0;
        // Create exactly the number of needed containers
        for (let i = 0; i < neededContainers; i++) {
            const appName = `container-${Date.now()}-${i}`;
            const appUrl = `https://${appName}.fly.dev`;

            // Create app and allocate IP
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

            const appId = appResponse.data?.data?.createApp?.app?.id;

            // Allocate IPv4
            await axios.post(
                FLY_API_URL,
                {
                    query: allocateIpv4Mutation,
                    variables: { appId }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${FLY_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Create machine with config
            const machineConfig = {
                config: {
                    image: 'registry.fly.io/expo-fast:latest',
                    mounts: [
                        {
                            volume: "data",
                            path: "/app/DemoApp"
                        }
                    ],
                    services: [
                        {
                            protocol: 'tcp',
                            internal_port: 8000,
                            autostop: "stop",
                            autostart: true,
                            max_machines_running: 1,
                            min_machines_running: 0,
                            ports: [
                                { port: 80, handlers: ['http'] },
                                { port: 443, handlers: ['tls', 'http'] }
                            ]
                        },
                        {
                            protocol: 'tcp',
                            internal_port: 8001,
                            autostop: "stop",
                            autostart: true,
                            max_machines_running: 1,
                            min_machines_running: 0,
                            ports: [
                                { port: 8001, handlers: ['tls', 'http'] }
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
                        memory_mb: 2048
                    }
                },
            };

            console.log(`Creating volume for app: ${appName}`);
            const volume = await createVolume(appName, 'dfw'); // You can adjust the region as needed

            const machines = await createMachines(appName, machineConfig, 1);
            const machineId = machines[0]?.id; // Get the machine ID from the first machine

            // Add new container to available_containers table with error checking
            const { data: insertData, error: insertError } = await supabase
                .from('available_containers')
                .insert([
                    {
                        app_name: appName,
                        app_url: `https://${appName}.makex.app`,
                        created_at: new Date().toISOString(),
                        machine_id: machineId // Add the machine_id to the insert
                    }
                ])
                .select();

            if (insertError) {
                console.error('Failed to insert container:', insertError);
                throw new Error(`Failed to insert container: ${insertError.message}`);
            }

            console.log('Successfully inserted container:', insertData);
            totalCreated++;
            console.log(`Created container ${appName}. Progress: ${totalCreated}/${neededContainers}`);
        }

        return NextResponse.json({
            success: true,
            message: `Created ${totalCreated} new containers`,
            currentCount: currentCount + totalCreated
        });

    } catch (error) {
        console.error('Error maintaining containers:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to maintain containers'
        }, { status: 500 });
    }
} 