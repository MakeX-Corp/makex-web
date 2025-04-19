import { NextResponse } from 'next/server';
import { getSupabaseWithUser } from '@/utils/server/auth';
import { Sandbox } from '@e2b/code-interpreter';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from 'redis';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    const { supabase, user } = result;
    
    // Parse request body
    const body = await request.json();
    const { appId, appName } = body;
    
    if (!appId || !appName) {
      return NextResponse.json({ error: 'appId and app are required' }, { status: 400 });
    }
    
    const supabaseAdmin = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    // Get app data from Supabase
    const { data: appData, error: appError } = await supabase
      .from('user_apps')
      .select('*')
      .eq('id', appId)
      .eq('user_id', user.id)
      .single();
      
    if (appError || !appData) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }
    
    // Create folder path for the app in Supabase storage following the policy structure
    const filePath = `${user.id}/${appName}/${appName}.zip`;
    console.log("Trying path:", filePath);
    
    // Get the app zip file from Supabase storage
    const { data: zipData, error: zipError } = await supabase
      .storage
      .from('makex-apps')
      .download(filePath);
      
    console.log("Download error:", zipError);
    console.log("Download data available:", !!zipData);
    
    if (zipError || !zipData) {
      console.error('App zip file not found');
      return NextResponse.json({ 
        error: 'App zip file not found', 
        details: {
          path: filePath,
          error: zipError
        }
      }, { status: 404 });
    }
    
    // Create a temporary file to store the zip
    const tempDir = '/tmp';
    const zipFilePath = path.join(tempDir, `${appName}.zip`);
    
    // Write the zip file to disk
    fs.writeFileSync(zipFilePath, Buffer.from(await zipData.arrayBuffer()));
    
    // Create a sandbox
    const sandbox = await Sandbox.create('px2b0gc7d6r1svvz8g5t', { timeoutMs: 600_000 });
    
    // // Upload the zip file to sandbox
    await sandbox.files.write('/app.zip', await zipData.arrayBuffer());
    
    // // Run commands to set up the environment
    await sandbox.commands.run('sudo rm -rf /app/expo-app');
    await sandbox.commands.run('sudo mkdir -p /app/expo-app');
    // install unzip
    await sandbox.commands.run('echo "Installing unzip"');
    // await sandbox.commands.run('apt-get update');
    // await sandbox.commands.run('apt-get install -y unzip');
    await sandbox.commands.run('sudo unzip /app.zip -d /app/expo-app');
    
    // Get hosts for the API and app
    const apiHost = sandbox.getHost(8001);
    
    // Start the Expo app in the background
    const  runResult = await sandbox.commands.run(`cd /app/expo-app && sudo yarn && export EXPO_PACKAGER_PROXY_URL=https://${apiHost} && yarn expo start --port 8000`, { background: true });
    console.log("Result:", runResult);
    
    const expoHost = sandbox.getHost(8000);
    // Connect to Redis for proxy configuration
    const redis = createClient({
      url: process.env.REDIS_URL,
    });
    
    await redis.connect();

    console.log("Redis connected");
    console.log("Expo host:", expoHost);
    console.log("API host:", apiHost);
    
    try {
      // Store mappings in Redis
      await redis.set(`proxy:${appName}.makex.app`, `https://${expoHost}`);
      await redis.set(`proxy:api-${appName}.makex.app`, `https://${apiHost}`);
      
      await redis.disconnect();
    } catch (redisError) {
      console.error('Redis error:', redisError);
    }
    
    // // Clean up the temporary file
    // if (fs.existsSync(zipFilePath)) {
    //   fs.unlinkSync(zipFilePath);
    // }
    
    // Update sandbox ID in the database
    const { error: updateError } = await supabase
      .from('user_apps')
      .update({
        sandbox_id: sandbox.sandboxId,
        sandbox_status: 'active',
      })
      .eq('id', appId)
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error('Error updating sandbox info:', updateError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'App successfully loaded and started',
      app_url: `https://${appName}.makex.app`,
      api_url: `https://api-${appName}.makex.app`,
      sandbox_id: sandbox.sandboxId
    });
    
  } catch (error: any) {
    console.error('Sandbox error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process sandbox request' },
      { status: 500 }
    );
  }
}
