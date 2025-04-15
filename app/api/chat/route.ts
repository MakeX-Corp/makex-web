import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/file-backend-api-client";
import { checkDailyMessageLimit } from "@/utils/check-daily-limit";

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
  const lastUserMessage = messages[messages.length - 1];
  // Get the user API client
  const userResult = await getSupabaseWithUser(req);
  if (userResult instanceof NextResponse) return userResult;
  const { supabase, user } = userResult;
  // Get appUrl from query params
  let apiUrl = appUrl.replace("makex.app", "fly.dev");
  const API_BASE = apiUrl + ":8001";

  // Check daily message limit using the new utility function
  const MAX_DAILY_MESSAGES = parseInt(process.env.MAX_DAILY_MESSAGES || "20");
  const limitCheck = await checkDailyMessageLimit(
    supabase,
    user,
    MAX_DAILY_MESSAGES
  );
  if (limitCheck.error) {
    return NextResponse.json(
      { error: limitCheck.error },
      { status: limitCheck.status }
    );
  }
  let imageUrl = null;
  // Check if the last user message has an image and upload it
  if (lastUserMessage?.experimental_attachments?.length > 0) {
    try {
      console.log("Found image attachment in message, attempting to upload...");
      const imageAttachment = lastUserMessage.experimental_attachments[0];

      // Validate it's a base64 image
      if (
        !imageAttachment.url ||
        !imageAttachment.url.startsWith("data:image/")
      ) {
        console.log("Image is not a valid base64 string, skipping upload");
      } else {
        // Extract content type and data from base64
        const contentTypeMatch = imageAttachment.url.match(
          /^data:([^;]+);base64,/
        );
        if (!contentTypeMatch) {
          throw new Error("Invalid base64 image format");
        }

        const contentType = contentTypeMatch[1];
        const base64Data = imageAttachment.url.replace(
          /^data:[^;]+;base64,/,
          ""
        );

        // Validate base64 data
        if (!base64Data || base64Data.trim() === "") {
          throw new Error("Empty base64 data");
        }

        const buffer = Buffer.from(base64Data, "base64");

        // Ensure file extension matches RLS policy
        let fileExt = contentType.split("/")[1] || "png";
        // Normalize extension to ensure it matches policy
        if (
          fileExt === "jpg" ||
          fileExt === "jpeg" ||
          fileExt === "png" ||
          fileExt === "gif"
        ) {
          // Extension is already valid
        } else if (fileExt === "svg+xml") {
          fileExt = "png"; // Convert SVG to allowed type
        } else {
          fileExt = "png"; // Default to png for unsupported types
        }

        // Use same path structure as test upload
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const filename = `${sessionId}/${timestamp}-${randomId}.${fileExt}`;

        console.log(
          `Attempting to upload image to path: ${filename}, content type: ${contentType}, extension: ${fileExt}`
        );

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(filename, buffer, {
            contentType: contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error("Supabase upload error:", JSON.stringify(uploadError));
          throw uploadError;
        }

        console.log("Upload successful:", uploadData);

        // Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from("chat-images")
          .getPublicUrl(filename);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error("Failed to get public URL");
        }

        imageUrl = publicUrlData.publicUrl;
        console.log("Image uploaded successfully to:", imageUrl);
      }
    } catch (error) {
      console.error("Error uploading image to storage:", error);
      // Continue with original message if upload fails
    }
  }
  const apiClient = createFileBackendApiClient(API_BASE);

  // Get the file tree first
  const fileTreeResponse = await apiClient.get("/file-tree", { path: "." });
  const fileTree = fileTreeResponse.data;

  const modelName = "claude-3-5-sonnet-latest";

  const formattedMessages = messages.map((message: any) => {
    // If message has attachments, format them as image parts
    if (message.experimental_attachments?.length) {
      return {
        role: message.role,
        content: [
          { type: "text", text: message.content || "" },
          ...message.experimental_attachments.map((attachment: any) => ({
            type: "image",
            image: attachment.url,
          })),
        ],
      };
    }

    // Regular text message
    return {
      role: message.role,
      content: message.content,
    };
  });
  const result = streamText({
    model: anthropic(modelName),
    messages: formattedMessages,
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
        description: "Install yarn packages",
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

      getFileTree: tool({
        description: "Get the directory tree structure",
        parameters: z.object({
          path: z
            .string()
            .describe("The path to get the directory tree from")
            .default("."),
        }),
        execute: async ({ path }) => {
          try {
            const response = await apiClient.get("/file-tree", { path });
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
    You are a senior software engineer who is an expert in React Native and Expo. 
    You can only write files in React Native.
    You cannot install any packages.
    You can also replace text in a file.
    You can also delete a file.
    You can also create a new file.
    You can also read a file.

    Use jsx syntax.

    Current file tree structure:
    ${JSON.stringify(fileTree, null, 2)}

    The initial render of the app is in app/index.jsx

    Make sure you always link changes or whatever you do to app/index.jsx because that is the initial render of the app. So user can see the changes.

    Keep in mind user cannot upload images, sounds or anything else. He can only talk to you and you are the programmer.

    Make sure you understand the user's request and the file tree structure. and make the changes to the correct files.

    Make sure to delete the file which seems redundant to you
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
        metadata: { streamed: false, imageUrl: imageUrl || null }, //save image url in the metadata
        input_tokens_used: inputTokens,
        output_tokens_used: 0,
        cost: inputCost,
        session_id: sessionId,
        message_id: lastUserMessage.id,
      });
    },
    maxSteps: 30, // allow up to 30 steps
  });
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
