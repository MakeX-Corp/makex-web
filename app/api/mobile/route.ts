import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { generateAppName } from "@/utils/server/app-name-generator";
import { tasks } from "@trigger.dev/sdk/v3";
import { insertAgentResponseDb } from "@/trigger/insert-agent-response-db";

export const maxDuration = 800;

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
      "create-container-claude",
      {
        userId: user.id,
        appId: insertedApp.id,
        appName,
      },
      { pollIntervalMs: 1000 }
    );

    const api_url = `https://${result.output.apiHost}`;
    const app_url = `https://${result.output.appHost}`;

    console.log("API URL:", api_url);
    console.log("APP URL:", app_url);

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

    try {
      const response = await fetch(`${api_url}/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.FILE_BACKEND_API_KEY || '',
        },
        body: JSON.stringify({ prompt }),
      });


      if (!response.ok) {
        console.error("External service responded with status:", response.status);
        throw new Error(`External service responded with status: ${response.status}`);
      }

      // Create a new ReadableStream from the response
      const stream = new ReadableStream({
        async start(controller) {
          console.log('Starting stream processing');
          const reader = response.body?.getReader();
          if (!reader) {
            console.log('No reader available, closing stream');
            controller.close();
            return;
          }
          console.log('Reader initialized successfully');

          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          let buffer = '';
          let collectedResponse = '';
          
          const appUrl = `https://${appName}.makex.app`;
          // Send app name as first message
          controller.enqueue(encoder.encode(JSON.stringify({ appUrl }) + '\n'));

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                // Process any remaining buffer
                if (buffer.trim()) {
                  try {
                    const json = JSON.parse(buffer);
                    controller.enqueue(encoder.encode(JSON.stringify(json) + '\n'));
                    collectedResponse += JSON.stringify(json) + '\n';
                  } catch (e) {
                    console.error('Invalid JSON in final buffer:', buffer);
                  }
                }
                controller.close();
                break;
              }

              // Decode the chunk and add to buffer
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              collectedResponse += chunk;
              
              // Try to find complete JSON objects in the buffer
              let startIndex = 0;
              while (true) {
                const jsonStart = buffer.indexOf('{', startIndex);
                if (jsonStart === -1) break;
                
                try {
                  const jsonStr = buffer.slice(jsonStart);
                  const json = JSON.parse(jsonStr);
                  // If we successfully parsed, send this chunk
                  controller.enqueue(encoder.encode(JSON.stringify(json) + '\n'));
                  // Update buffer and startIndex
                  buffer = buffer.slice(jsonStart + jsonStr.length);
                  startIndex = 0;
                } catch (e) {
                  // If parsing failed, this might be an incomplete JSON
                  startIndex = jsonStart + 1;
                  break;
                }
              }
            }

            // Insert the collected response after the stream is complete
            await insertAgentResponseDb.trigger({
              appId: insertedApp.id,
              userId: user.id,
              agentResponse: collectedResponse,
            });
          } catch (error) {
            console.error('Error in stream processing:', error);
            controller.error(error);
          }
        }
      });

      // Return the stream with appropriate headers
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error('Error in agent route:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in app creation:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

