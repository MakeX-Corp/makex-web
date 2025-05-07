import { schedules } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { pauseContainer } from "./pause-container";

export const firstScheduledTask = schedules.task({
  id: "auto-pause-containers",
  cron: "* * * * *",
  run: async (payload) => {
    try {
        // Get all active sandbox containers
        const supabase = await getSupabaseAdmin();
        const { data: activeSandbox, error: activeSandboxError } =
            await supabase
                .from("user_sandboxes")
                .select("*")
                .in("sandbox_status", ["active"]);

        if (activeSandboxError) {
            console.error("Error fetching active apps:", activeSandboxError);
            console.error("Failed to fetch active apps");
            return;
        }

        console.log("Active sandboxes:", activeSandbox);

        if (!activeSandbox || activeSandbox.length === 0) {
            console.log("No active apps found");
            return;
        }

        // Current time
        const stoppedApps = [];

        // Process each active app
        for (const sandbox of activeSandbox) {
            try {
                // Get the latest message for this app
                const { data: latestMessage, error: messageError } = await supabase
                    .from("app_chat_history")
                    .select("created_at")
                    .eq("app_id", sandbox.app_id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();


                let mostRecentActivity = new Date(sandbox.sandbox_updated_at);
                if (latestMessage) {
                    const lastMessageTime = new Date(latestMessage.created_at + "Z");
                    if (lastMessageTime > mostRecentActivity) {
                        mostRecentActivity = lastMessageTime;
                    }
                }
                

                console.log("RECENT TIME", new Date().getTime())
                const diffMinutes = Math.floor(
                    (new Date().getTime() - mostRecentActivity.getTime()) / (1000 * 60)
                );

                console.log("Diff minutes:", diffMinutes);

                if (diffMinutes > 5) {
                    stoppedApps.push(sandbox.id);
                    console.log("Pausing sandbox:", sandbox.id);
                    await pauseContainer.trigger(
                        {
                            userId: sandbox.user_id,
                            appId: sandbox.app_id,
                            appName: sandbox.app_name,
                        },
                        {
                            queue: { name: "auto-pause-containers" },
                        }
                    );
                }
            } catch (appError) {
                console.error(`Error processing app ${sandbox.id}:`, appError);
            }
        }

        console.log(`Auto-stop completed. Stopped ${stoppedApps.length} inactive apps.`);
    } catch (error) {
        console.error("Error in auto-stop routine:", error);
        console.error("Internal server error during auto-stop");
    }
  },
});