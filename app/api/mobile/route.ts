import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { generateAppName } from "@/utils/server/app-name-generator";
import { createContainer } from "@/trigger/create-container";
import { tasks } from "@trigger.dev/sdk/v3";


export const maxDuration = 300;

export async function POST(request: Request) {
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;
  const { supabase, user } = result;

  try {
    // Get prompt from request body
    const body = await request.json();
    const { prompt } = body;

    const appName = generateAppName();

    // Begin transaction to ensure both app and session are created atomically
    // Insert into Supabase user_apps table

    const { data: insertedApp, error: insertError } = await supabase
      .from("user_apps")
      .insert({
        user_id: user.id,
        app_name: appName,
        app_url: `https://${appName}.makex.app`,
        api_url: `https://api-${appName}.makex.app`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save app data" },
        { status: 500 }
      );
    }

    // Trigger container creation and wait for completion
    const result = await tasks.triggerAndPoll(
        "create-container", {
        userId: user.id,
        appId: insertedApp.id,
        appName,
      },
      { pollIntervalMs: 1000 }
    );
      
    

    // Create the agent_history in the same transaction
    const { data: agentHistory, error: agentHistoryError } = await supabase
      .from("agent_history")
      .insert({
        app_id: insertedApp.id,
        user_id: user.id,
        human_input: prompt,
      })
      .select()
      .single();

    if (agentHistoryError) {
      console.error("Session creation error:", agentHistoryError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }


    // return 200
    return NextResponse.json({
      message: "Agent history created successfully",
    }, { status: 200 });

   
  } catch (error) {
    console.error("Error in app creation:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

