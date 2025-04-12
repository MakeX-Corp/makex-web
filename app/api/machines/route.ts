import { NextResponse } from 'next/server';
import { FlyMachinesClient } from './client';

// Initialize the client with your API token
const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
if (!FLY_API_TOKEN) {
  console.error('FLY_API_TOKEN is not set in environment variables');
}

const flyClient = new FlyMachinesClient(FLY_API_TOKEN || '');

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const appName = searchParams.get('app');
  const machineId = searchParams.get('machineId');
  const action = searchParams.get('action');
  const state = searchParams.get('state');
  const timeout = searchParams.get('timeout');

  if (!appName || !machineId || !action) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'status':
        return NextResponse.json(await flyClient.getMachine(appName, machineId));
      case 'stop':
        return NextResponse.json(await flyClient.stopMachine(appName, machineId));
      case 'start':
        return NextResponse.json(await flyClient.startMachine(appName, machineId));
      case 'suspend':
        return NextResponse.json(await flyClient.suspendMachine(appName, machineId));
      case 'wait':
        if (!state) return NextResponse.json({ error: 'State required for wait' }, { status: 400 });
        return NextResponse.json(await flyClient.waitForMachine(appName, machineId, state, timeout ? parseInt(timeout) : undefined));
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
