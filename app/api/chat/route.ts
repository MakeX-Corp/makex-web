import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/file-backend-api-client";

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

// GET /api/chat - Get all messages for a specific session
export async function GET(req: Request) {
  try {
    const userResult = await getSupabaseWithUser(req);
    if (userResult instanceof NextResponse) return userResult;
    const { supabase, user } = userResult;

    // Get session ID from query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const appId = searchParams.get("appId");

    if (!sessionId || !appId) {
      return NextResponse.json(
        { error: "Session ID and App ID are required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user and app
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from("app_chat_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("app_id", appId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { messages, appUrl, appId, sessionId } = await req.json();
  // Get the last user message
  const lastUserMessage = messages[messages.length - 1];

  // get appUrl from query params
  let apiUrl = appUrl.replace("makex.app", "fly.dev");
  const API_BASE = apiUrl + ":8001";

  const userResult = await getSupabaseWithUser(req);
  if (userResult instanceof NextResponse) return userResult;
  const { supabase, user } = userResult;

  // Check daily message limit using existing table
  const today = new Date().toISOString().split("T")[0];
  const { count, error: countError } = await supabase
    .from("app_chat_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", today)
    .lt(
      "created_at",
      new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString()
    );

  if (countError) {
    return NextResponse.json(
      { error: "Failed to check message limit" },
      { status: 500 }
    );
  }

  const MAX_DAILY_MESSAGES = parseInt(process.env.MAX_DAILY_MESSAGES || "20");
  if (count && count >= MAX_DAILY_MESSAGES) {
    return NextResponse.json(
      { error: "Daily message limit reached. Please try again tomorrow." },
      { status: 429 }
    );
  }

  let fullResponse = "";
  let commitHash = "";

  const modelName = "claude-3-5-sonnet-latest";
  const apiClient = createFileBackendApiClient(API_BASE);

  const result = streamText({
    model: anthropic(modelName),
    messages,
    tools: {
      readFile: tool({
        description: "Read contents of a file",
        parameters: z.object({
          path: z.string().describe("The path to the file to read"),
        }),
        execute: async ({ path }) => {
          try {
            const data = await apiClient.get("/file", { path });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      listDirectory: tool({
        description: "List contents of a directory",
        parameters: z.object({
          path: z
            .string()
            .describe("The path to list contents from")
            .default("."),
        }),
        execute: async ({ path }) => {
          try {
            const data = await apiClient.get("/directory", { path });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      createDirectory: tool({
        description: "Create a new directory",
        parameters: z.object({
          path: z.string().describe("The path where to create the directory"),
        }),
        execute: async ({ path }) => {
          try {
            const data = await apiClient.post("/directory", { path });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      deleteDirectory: tool({
        description: "Delete a directory and its contents",
        parameters: z.object({
          path: z.string().describe("The path of the directory to delete"),
        }),
        execute: async ({ path }) => {
          try {
            const data = await apiClient.delete("/directory", { path });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      installPackages: tool({
        description: "Install npm/yarn packages",
        parameters: z.object({
          packages: z
            .array(z.string())
            .describe("List of packages to install in an array"),
        }),
        execute: async ({ packages }) => {
          try {
            const data = await apiClient.post("/install/packages", {
              packages,
            });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      executeCommand: tool({
        description: "Execute a yarn/npm/npx command",
        parameters: z.object({
          command: z
            .string()
            .describe(
              "The command to execute (only yarn, npm, or npx commands allowed)"
            ),
        }),
        execute: async ({ command }) => {
          try {
            const data = await apiClient.post("/execute/command", { command });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      insertText: tool({
        description: "Insert text at a specific line in a file",
        parameters: z.object({
          path: z.string().describe("The path to the file"),
          insert_line: z
            .number()
            .describe("The line number where to insert the text"),
          new_str: z.string().describe("The text to insert"),
        }),
        execute: async ({ path, insert_line, new_str }) => {
          try {
            const data = await apiClient.put("/file/insert", {
              path,
              insert_line,
              new_str,
            });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      writeFile: tool({
        description: "Write content to a file",
        parameters: z.object({
          path: z.string().describe("The path where to write the file"),
          content: z.string().describe("The content to write to the file"),
        }),
        execute: async ({ path, content }) => {
          try {
            const data = await apiClient.post("/file", {
              path,
              content,
            });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      deleteFile: tool({
        description: "Delete a file",
        parameters: z.object({
          path: z.string().describe("The path of the file to delete"),
        }),
        execute: async ({ path }) => {
          try {
            const data = await apiClient.delete("/file", { path });
            return { success: true, data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),

      replaceInFile: tool({
        description: "Replace text in a file",
        parameters: z.object({
          path: z.string().describe("The path to the file"),
          find: z.string().describe("The text to find"),
          replace_with: z.string().describe("The text to replace with"),
        }),
        execute: async ({ path, find, replace_with }) => {
          try {
            const response = await apiClient.put("/file/replace", {
              path,
              find,
              replace_with,
            });
            return { success: true, data: response.data };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Unknown error occurred",
            };
          }
        },
      }),
    },
    system: `
    You are a helpful assistant that can read and write files. You can only write files in React Native.
    You cannot install any packages.
    You can also replace text in a file.
    You can also delete a file.
    You can also create a new file.
    You can also read a file.

    Make sure to delet the file which seems redundant to you
    You need to say what you are doing in 3 bullet points or less every time you are returning a response
    Try to do it in minimum tool calls
    `,
    onFinish: async (result) => {
      // Save checkpoint after completing the response
      const inputTokens = result.usage.promptTokens;
      const inputCost = inputTokens * 0.000003;

      // Insert user's last message into chat history
      await supabase.from("app_chat_history").insert({
        app_id: appId,
        user_id: user.id,
        content: lastUserMessage.content,
        role: "user",
        model_used: modelName,
        metadata: { streamed: false },
        input_tokens_used: inputTokens,
        output_tokens_used: 0,
        cost: inputCost,
        session_id: sessionId,
        message_id: lastUserMessage.id,
      });
    },
    maxSteps: 5, // allow up to 5 steps
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
