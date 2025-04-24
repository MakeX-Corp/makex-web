import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { pauseE2BContainer } from "@/utils/server/e2b";
import { UserSandbox } from "@/types/sandbox";
import { redisUrlSetter } from "@/utils/server/redis-client";


export const maxDuration = 300;

// This route will be triggered by a cron job
export async function GET(request: Request) {
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
            return NextResponse.json(
                { error: "Failed to fetch active apps" },
                { status: 500 }
            );
        }

        console.log("Active sandboxes:", activeSandbox);

        if (!activeSandbox || activeSandbox.length === 0) {
            return NextResponse.json({ message: "No active apps found" });
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

                const diffMinutes = Math.floor(
                    (new Date().getTime() - mostRecentActivity.getTime()) / (1000 * 60)
                );

                console.log("Diff minutes:", diffMinutes);

                if (diffMinutes > -1) {
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
                            return NextResponse.json(
                                { error: updatedSandboxError.message },
                                { status: 500 }
                            );
                        }

                        stoppedApps.push(sandbox.id);

                        // pause the sandbox
                        await pauseE2BContainer(sandbox.sandbox_id);

                        await redisUrlSetter(sandbox.app_name, "makex.app/app-not-found", "makex.app/app-not-found");



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
                            return NextResponse.json(
                                { error: updatedSandbox2Error.message },
                                { status: 500 }
                            );
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

        return NextResponse.json({
            message: `Auto-stop completed. Stopped ${stoppedApps.length} inactive apps.`,
        });
    } catch (error) {
        console.error("Error in auto-stop routine:", error);
        return NextResponse.json(
            { error: "Internal server error during auto-stop" },
            { status: 500 }
        );
    }
}




