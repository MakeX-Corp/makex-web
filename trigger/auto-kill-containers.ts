import { schedules } from "@trigger.dev/sdk";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { deleteContainer } from "./delete-container";

export const autoKillContainers = schedules.task({
  id: "auto-kill-containers",
  cron: "0 */6 * * *",
  run: async () => {
    try {
      const supabase = await getSupabaseAdmin();
      const { data: finishedApps, error: appsError } = await supabase
        .from("user_apps")
        .select(
          `
          id,
          app_name,
          current_sandbox_id,
          updated_at,
          user_id,
          user_sandboxes!current_sandbox_id(sandbox_status)
        `,
        )
        .eq("coding_status", "finished")
        .not("current_sandbox_id", "is", null);

      if (appsError) {
        console.error("Error fetching finished apps:", appsError);
        console.error("Failed to fetch finished apps");
        return;
      }

      console.log("Finished apps for auto-kill:", finishedApps);

      if (!finishedApps || finishedApps.length === 0) {
        console.log("No finished apps found for auto-kill");
        return;
      }

      const pausedFinishedApps = finishedApps.filter((app) => {
        const sandbox = app.user_sandboxes as any;
        return sandbox && sandbox.sandbox_status === "paused";
      });

      console.log("Paused finished apps for auto-kill:", pausedFinishedApps);

      if (pausedFinishedApps.length === 0) {
        console.log("No paused finished apps found for auto-kill");
        return;
      }

      const killedContainers = [];

      for (const app of pausedFinishedApps) {
        try {
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

          console.log("Most recent activity:", mostRecentActivity);
          const diffMinutes = Math.floor(
            (new Date().getTime() - mostRecentActivity.getTime()) / (1000 * 60),
          );

          console.log("Diff minutes:", diffMinutes);

          if (diffMinutes > 2800) {
            killedContainers.push(app.current_sandbox_id);
            console.log("Killing container:", app.current_sandbox_id);
            await deleteContainer.trigger(
              {
                userId: app.user_id,
                appId: app.id,
                appName: app.app_name,
              },
              {
                queue: "auto-kill-containers",
              },
            );
          }
        } catch (appError) {
          console.error(
            `Error processing app ${app.id} for auto-kill:`,
            appError,
          );
        }
      }

      console.log(
        `Auto-kill completed. Killed ${killedContainers.length} inactive containers.`,
      );
    } catch (error) {
      console.error("Error in auto-kill routine:", error);
      console.error("Internal server error during auto-kill");
    }
  },
});
