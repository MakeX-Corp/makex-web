import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { generateAppName } from "@/utils/server/app-name-generator";
import { tasks } from "@trigger.dev/sdk/v3";

export const maxDuration = 800;

async function handleStreamingResponse(
  apiUrl: string,
  prompt: string,
  appId: string,
  userId: string,
  appName: string
) {
  try {
    const response = await fetch(`${apiUrl}/claude`, {
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
        controller.enqueue(encoder.encode(JSON.stringify({ appUrl }) + '\n'));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
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

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            collectedResponse += chunk;
            
            let startIndex = 0;
            while (true) {
              const jsonStart = buffer.indexOf('{', startIndex);
              if (jsonStart === -1) break;
              
              try {
                const jsonStr = buffer.slice(jsonStart);
                const json = JSON.parse(jsonStr);
                controller.enqueue(encoder.encode(JSON.stringify(json) + '\n'));
                buffer = buffer.slice(jsonStart + jsonStr.length);
                startIndex = 0;
              } catch (e) {
                startIndex = jsonStart + 1;
                break;
              }
            }
          }
        } catch (error) {
          console.error('Error in stream processing:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in streaming response:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  const result = await getSupabaseWithUser(request as NextRequest);
  if (result instanceof NextResponse || 'error' in result) return result;
  const { supabase, user } = result;

  try {
    const body = await request.json();
    const { prompt } = body;

    const appName = generateAppName();

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

    console.log("Triggering container creation");
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

    return handleStreamingResponse(api_url, prompt, insertedApp.id, user.id, appName);
  } catch (error) {
    console.error("Error in app creation:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const result = await getSupabaseWithUser(request as NextRequest);
  if (result instanceof NextResponse || 'error' in result) return result;
  const { supabase, user } = result;

  const { appUrl, prompt } = await request.json();

  console.log("App URL:", appUrl);
  console.log("Prompt:", prompt);

  // Remove exp:// prefix if present and extract app name
  const cleanUrl = appUrl.replace('exp://', '');
  const appName = cleanUrl.split(".")[0];

  console.log("App name:", appName);

  const { data: app, error: appError } = await supabase
    .from("user_apps")
    .select("id")
    .eq("app_name", appName)
    .single();

  if (appError) { 
    console.error("App not found:", appError);
    return NextResponse.json(
      { error: "App not found" },
      { status: 404 }
    );
  }

  const appId = app.id;

  await tasks.triggerAndPoll(
    "resume-container",
    { userId: user.id, appId, appName },
    { pollIntervalMs: 1000 }
  );

  const apiUrl = `https://api-${appName}.makex.app`;
  return handleStreamingResponse(apiUrl, prompt, appId, user.id, appName);
}