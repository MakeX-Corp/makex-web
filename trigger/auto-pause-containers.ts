import { schedules } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { pauseContainer } from "./pause-container";

export const firstScheduledTask = schedules.task({
  id: "auto-pause-containers",
  cron: "* * * * *",
  run: async (payload) => {
    try {
      // Get all finished apps with their current sandbox
      const supabase = await getSupabaseAdmin();
      const { data: finishedApps, error: appsError } = await supabase
        .from("user_apps")
        .select(`
          id,
          app_name,
          current_sandbox_id,
          updated_at
        `)
        .eq("status", "finished")
        .not("current_sandbox_id", "is", null);

      if (appsError) {
        console.error("Error fetching finished apps:", appsError);
        console.error("Failed to fetch finished apps");
        return;
      }

      console.log("Finished apps:", finishedApps);

      if (!finishedApps || finishedApps.length === 0) {
        console.log("No finished apps found");
        return;
      }

      // Current time
      const stoppedContainers = [];

      // Process each finished app
      for (const app of finishedApps) {
        try {
          // Get the latest message for this app
          const { data: latestMessage, error: messageError } = await supabase
            .from("chat_history")
            .select("created_at")
            .eq("app_id", app.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          let mostRecentActivity = new Date(app.updated_at);
          if (latestMessage) {
            const lastMessageTime = new Date(latestMessage.created_at + "Z");
            if (lastMessageTime > mostRecentActivity) {
              mostRecentActivity = lastMessageTime;
            }
          }

          console.log("RECENT TIME", new Date().getTime());
          const diffMinutes = Math.floor(
            (new Date().getTime() - mostRecentActivity.getTime()) / (1000 * 60),
          );

          console.log("Diff minutes:", diffMinutes);

          if (diffMinutes > 4) {
            stoppedContainers.push(app.current_sandbox_id);
            console.log("Pausing container:", app.current_sandbox_id);
            await pauseContainer.trigger(
              {
                sandboxId: app.current_sandbox_id,
                appName: app.app_name,
              },
              {
                queue: { name: "auto-pause-containers" },
              },
            );
          }
        } catch (appError) {
          console.error(`Error processing app ${app.id}:`, appError);
        }
      }

      console.log(
        `Auto-pause completed. Paused ${stoppedContainers.length} inactive containers.`,
      );
    } catch (error) {
      console.error("Error in auto-pause routine:", error);
      console.error("Internal server error during auto-pause");
    }
  },
});
