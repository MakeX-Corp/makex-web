import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";


//1. You need to export each task, even if it's a subtask
export const insertAgentResponseDb = task({
  //2. Use a unique id for each task
  id: "insert-agent-response-db",
  //3. The run function is the main function of the task
  run: async (payload: { appId: string, userId: string, agentResponse: string }) => {
    //4. You can write code that runs for a long time here, there are no timeouts
    console.log(process.env.NODE_ENV)
    console.log(payload.agentResponse);

    const adminSupabase = await getSupabaseAdmin();

    // Insert into agent_history table
    const { error: insertError } = await adminSupabase
      .from("agent_history")
      .insert({
        app_id: payload.appId,
        user_id: payload.userId,
        agent_response: payload.agentResponse,
      });

    if (insertError) {
      console.error("Failed to insert agent history:", insertError);
      throw insertError;
    }
  },
});