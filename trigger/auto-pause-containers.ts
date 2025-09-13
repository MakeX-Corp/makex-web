import { schedules } from "@trigger.dev/sdk";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { pauseContainer } from "./pause-container";

export const firstScheduledTask = schedules.task({
  id: "auto-pause-containers",
  cron: "* * * * *",
  queue: {
    name: "auto-pause-containers-queue",
    concurrencyLimit: 1,
  },
  run: async () => {
    try {
      const supabase = await getSupabaseAdmin();
      const { data: finishedApps, error: appsError } = await supabase
        .from("user_apps")
        .select(
          `
          id,
          app_name,
          current_sandbox_id
        `,
        )
        .eq("coding_status", "finished")
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

      const stoppedContainers = [];

      for (const app of finishedApps) {
        try {
          const { data: latestMessage, error: messageError } = await supabase
            .from("chat_history")
            .select("created_at")
            .eq("app_id", app.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const { data: sandbox, error: sandboxError } = await supabase
            .from("user_sandboxes")
            .select("sandbox_updated_at")
            .eq("id", app.current_sandbox_id)
            .single();

          if (sandboxError) {
            console.error(
              `Error fetching sandbox ${app.current_sandbox_id}:`,
              sandboxError,
            );
            continue;
          }

          let mostRecentActivity = new Date(sandbox.sandbox_updated_at);
          if (latestMessage) {
            const lastMessageTime = new Date(latestMessage.created_at + "Z");
            if (lastMessageTime > mostRecentActivity) {
              mostRecentActivity = lastMessageTime;
            }
          }

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
                queue: "pause-container-queue",
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
