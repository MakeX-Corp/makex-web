import { schedules } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { pauseE2BContainer } from "@/utils/server/e2b";
import { UserSandbox } from "@/types/sandbox";
import { redisUrlSetter } from "@/utils/server/redis-client";

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

                // For apps with no messages, use the app creation time
                // Otherwise use the latest message time
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

                if (diffMinutes > 3) {
                    try {
                        // pause the sandbox 
                        const { data: updatedSandbox, error: updatedSandboxError } =
                            await supabase
                                .from("user_sandboxes")
                                .update({
                                    sandbox_status: "pausing",
                                })
                                .eq("id", sandbox.id)
                                .select()
                                .overrideTypes<UserSandbox[]>();

                        if (updatedSandboxError) {
                            console.error("Error updating sandbox:", updatedSandboxError.message);
                            return;
                        }

                        stoppedApps.push(sandbox.id);

                        // pause the sandbox
                        await pauseE2BContainer(sandbox.sandbox_id);

                        // get the app 
                        const { data: app, error: appError } =
                            await supabase
                                .from("apps")
                                .select("app_name, app_url, api_url")
                                .eq("id", sandbox.app_id)
                                .single();

                        console.log("app",app)

                        await redisUrlSetter(app?.app_name, "makex.app/app-not-found", "makex.app/app-not-found");



                        const { data: updatedSandbox2, error: updatedSandbox2Error } =
                            await supabase
                                .from("user_sandboxes")
                                .update({
                                    sandbox_status: "paused",
                                })
                                .eq("id", sandbox.id)
                                .select()
                                .overrideTypes<UserSandbox[]>();

                        if (updatedSandbox2Error) {
                            console.error("Error updating sandbox final status:", updatedSandbox2Error.message);
                            return;
                        }
                    } catch (exportError) {
                        console.error(
                            `Error paussing sandbox for app ${sandbox.id}:`,
                            exportError
                        );
                    }
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