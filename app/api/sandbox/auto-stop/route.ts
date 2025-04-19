import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { Sandbox } from '@e2b/code-interpreter';

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
        const diffMinutes = Math.floor((now.getTime() - lastMessageTime.getTime()) / (1000 * 60));

        if (diffMinutes > 5) {
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
