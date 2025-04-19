import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { Sandbox } from '@e2b/code-interpreter';
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { createClient as createRedisClient } from 'redis';

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// This route will be triggered by a cron job
export async function GET(request: Request) {
  try {
    // Get all active sandbox containers
    const { data: activeApps, error: fetchError } = await supabase
      .from("user_apps")
      .select("*")
      .eq("sandbox_status", "active");

    if (fetchError) {
      console.error("Error fetching active apps:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch active apps" },
        { status: 500 }
      );
    }

    if (!activeApps || activeApps.length === 0) {
      return NextResponse.json({ message: "No active apps found" });
    }

    // Current time
    const now = new Date();
    const stoppedApps = [];

    // Setup Redis client
    const redis = createRedisClient({
      url: process.env.REDIS_URL,
    });
    await redis.connect();
    console.log("Redis connected");

    // Process each active app
    for (const app of activeApps) {
      try {
        // Get the latest message for this app
        const { data: latestMessage, error: messageError } = await supabase
          .from("app_chat_history")
          .select("created_at")
          .eq("app_id", app.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (messageError && messageError.code !== 'PGRST116') {
          console.error(`Error fetching latest message for app ${app.id}:`, messageError);
          continue;
        }

        // Skip if no message history (new app without chat)

        // Check if last message was more than 5 minutes ago
        const lastMessageTime = new Date(latestMessage?.created_at || new Date());
        // const diffMinutes = Math.floor((now.getTime() - lastMessageTime.getTime()) / (1000 * 60));

        const diffMinutes = 6

        if (diffMinutes > 5) {
          // Export the code before killing the sandbox
          try {
            if (app.api_url) {
              // Create a file backend client to interact with the sandbox
              const client = createFileBackendApiClient(app.api_url);
              
              // Export the code as zip
              try {
                const { data: codeZipBuffer } = await client.getFile("/export-code", {
                  responseType: 'arraybuffer',
                });
                
                // Log the file size
                const fileSizeMB = codeZipBuffer.byteLength / (1024 * 1024);
                console.log(`App ${app.app_name} export size: ${fileSizeMB.toFixed(2)}MB`);
                
                // Create folder structure: user_id/app_name
                const folderPath = `${app.user_id}/${app.app_name}`;
                
                // Upload to Supabase Storage
                const { error: uploadError } = await supabase
                  .storage
                  .from('makex-apps')
                  .upload(`${folderPath}/${app.app_name}.zip`, codeZipBuffer, {
                    contentType: 'application/zip',
                    upsert: true // Overwrite if exists
                  });
                  
                if (uploadError) {
                  console.error(`Error uploading app code for ${app.id}:`, uploadError);
                } else {
                  console.log(`Successfully exported and saved code for app ${app.app_name}`);
                }
              } catch (exportRequestError) {
                console.error(`Error requesting code export for app ${app.id}:`, exportRequestError);
              }
            }
          } catch (exportError) {
            return NextResponse.json({ error: `Error exporting code for app ${app.id}:`, exportError }, { status: 500 });
          }
          
          // Kill the sandbox container
          try {
            await Sandbox.kill(app.sandbox_id);
            
            // Update sandbox status in the database
            const { error: updateError } = await supabase
              .from("user_apps")
              .update({ sandbox_status: 'deleted' })
              .eq("id", app.id);

            if (updateError) {
              console.error(`Error updating app status for ${app.id}:`, updateError);
              continue;
            }

            // Remove Redis proxy records
            try {
              await redis.set(`proxy:${app.app_name}.makex.app`, 'https://makex.app');
              await redis.set(`proxy:api-${app.app_name}.makex.app`, 'https://makex.app');
              console.log(`Successfully removed Redis proxy records for ${app.app_name}`);
            } catch (redisError) {
              console.error(`Error removing Redis proxy records for ${app.app_name}:`, redisError);
            }

            stoppedApps.push({
              id: app.id,
              app_name: app.app_name,
              last_activity: lastMessageTime,
              inactive_minutes: Math.floor(diffMinutes)
            });
          } catch (killError) {
            console.error(`Error killing sandbox for app ${app.id}:`, killError);
          }
        }
      } catch (appError) {
        console.error(`Error processing app ${app.id}:`, appError);
      }
    }

    // Disconnect from Redis
    await redis.disconnect();
    console.log("Redis disconnected");

    return NextResponse.json({
      message: `Auto-stop completed. Stopped ${stoppedApps.length} inactive apps.`,
      stopped_apps: stoppedApps
    });
  } catch (error) {
    console.error("Error in auto-stop routine:", error);
    return NextResponse.json(
      { error: "Internal server error during auto-stop" },
      { status: 500 }
    );
  }
}
