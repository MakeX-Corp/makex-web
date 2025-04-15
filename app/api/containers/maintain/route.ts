import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator';

// ─────────────────────────────────────────────────────────────────────────────
//  Fly endpoints & secrets
// ─────────────────────────────────────────────────────────────────────────────
const FLY_API_TOKEN = process.env.FLY_API_TOKEN!;
const FLY_API_URL   = 'https://api.fly.io/graphql';
const FLY_MACH_API  = 'https://api.machines.dev/v1';

// ─────────────────────────────────────────────────────────────────────────────
//  GraphQL
// ─────────────────────────────────────────────────────────────────────────────
const CREATE_APP = `
  mutation ($name: String!, $orgId: ID!) {
    createApp(input: { name: $name, organizationId: $orgId }) {
      app { id name }
    }
  }
`;

const ALLOC_IP = `
  mutation ($appId: ID!) {
    allocateIpAddress(input: { appId: $appId, type: v4 }) {
      ipAddress { id address }
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
function randName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    length: 3,
    style: 'lowerCase'
  });
}

async function flyRequest<T>(method: 'get'|'post'|'delete'|'put', url: string, data?: any) {
  return await axios.request<T>({ method, url, data, headers: { Authorization: `Bearer ${FLY_API_TOKEN}` } });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Volume helpers
// ─────────────────────────────────────────────────────────────────────────────
async function createVolume(app: string, region = 'dfw', sizeGb = 2) {
  const { data } = await flyRequest<any>('post', `${FLY_MACH_API}/apps/${app}/volumes`, {
    name: 'data', region, size_gb: sizeGb
  });
  return data.id as string;
}

async function deleteVolume(app: string, volumeId: string) {
  await flyRequest('delete', `${FLY_MACH_API}/apps/${app}/volumes/${volumeId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Machine creation (fixed memMb = 2048)
// ─────────────────────────────────────────────────────────────────────────────
async function createMachine(app: string, volumeId: string) {
  const body = {
    region: 'dfw',
    config: {
      image: 'registry.fly.io/expo-fast:latest',
      guest: { cpu_kind: 'shared', cpus: 2, memory_mb: 2048 },
      env: {
        PORT: '8000',
        EXPO_PACKAGER_PROXY_URL: `http://${app}.fly.dev`
      },
      services: [
        {
          protocol: 'tcp',
          internal_port: 8000,
          autostart: true,
          autostop: 'stop',
          min_machines_running: 0,
          max_machines_running: 1,
          ports: [
            { port: 80,  handlers: ['http'] },
            { port: 443, handlers: ['tls', 'http'] }
          ]
        },
        {
          protocol: 'tcp',
          internal_port: 8001,
          autostart: true,
          autostop: 'stop',
          min_machines_running: 0,
          max_machines_running: 1,
          ports: [ { port: 8001, handlers: ['tls', 'http'] } ]
        }
      ],
      mounts: [ { volume: volumeId, path: '/app/DemoApp' } ]
    }
  };
  return await flyRequest<any>('post', `${FLY_MACH_API}/apps/${app}/machines`, body);
}

async function provisionMachine(app: string) {
  const volumeId = await createVolume(app);
  try {
    const { data } = await createMachine(app, volumeId);
    return { machineId: data.id as string, volumeId };
  } catch (e: any) {
    // clean up volume on failure
    await deleteVolume(app, volumeId).catch(() => {});
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Vercel edge‑function handler
// ─────────────────────────────────────────────────────────────────────────────
export const maxDuration = 300;

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production' && req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data: rows } = await supabase.from('available_containers').select('id');
    const have = rows?.length ?? 0;
    const want = parseInt(process.env.MAX_CONTAINERS || '10', 10);
    const need = Math.max(0, want - have);
    if (need === 0) return NextResponse.json({ success: true, message: 'Pool full', currentCount: have });

    let created = 0;
    for (let i = 0; i < need; i++) {
      const appName = randName();

      // 1) create Fly app
      const { data: appResp } = await axios.post(FLY_API_URL, {
        query: CREATE_APP,
        variables: { name: appName, orgId: process.env.FLY_ORG_ID }
      }, { headers: { Authorization: `Bearer ${FLY_API_TOKEN}` } });
      const appId = appResp.data.createApp.app.id;

      // 2) allocate IPv4
      await axios.post(FLY_API_URL, { query: ALLOC_IP, variables: { appId } }, {
        headers: { Authorization: `Bearer ${FLY_API_TOKEN}` }
      });

      // 3) volume + machine
      const { machineId } = await provisionMachine(appName);

      // 4) record
      await supabase.from('available_containers').insert({
        app_name: appName,
        app_url: `https://${appName}.makex.app`,
        machine_id: machineId,
        created_at: new Date().toISOString()
      });
      created++;
    }

    return NextResponse.json({ success: true, message: `Created ${created}`, currentCount: have + created });
  } catch (err: any) {
    console.error('maintain‑containers error', err);
    return NextResponse.json({ success: false, error: err.message ?? 'unknown' }, { status: 500 });
  }
}
