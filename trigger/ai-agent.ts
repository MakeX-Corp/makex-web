import { task } from "@trigger.dev/sdk/v3";
import {
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
  generateText,
} from "ai";
import { createTools } from "@/utils/server/tool-factory";
import { getPrompt } from "@/utils/server/prompt";
import { getDirectoryTree, saveCheckpoint } from "@/utils/server/e2b";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { resumeContainer } from "./resume-container";
import { sendPushNotifications } from "@/utils/server/sendPushNotifications";
import { CLAUDE_SONNET_4_MODEL } from "@/const/const";
import { gateway, getModelAndOrder } from "@/utils/server/gateway";

const LOG_PREFIX = "[AI Agent]";

export const aiAgent = task({
  id: "ai-agent",
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: {
    appId: string;
    userPrompt: string;
    images?: string[];
    model?: string;
  }) => {
    try {
      const { appId, userPrompt, images = [], model } = payload;

      // Use provided model or fall back to default
      const modelName = model || CLAUDE_SONNET_4_MODEL;

      // Get Supabase admin client
      const supabase = await getSupabaseAdmin();

      // Get the latest session for this app
      const { data: latestSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("app_id", appId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (sessionError) {
        throw new Error(
          `Failed to fetch latest session: ${sessionError.message}`,
        );
      }

      if (!latestSession) {
        throw new Error("No session found for this app");
      }

      const sessionId = latestSession.id;

      // Get chat history for this session
      const { data: chatHistory, error: historyError } = await supabase
        .from("app_chat_history")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (historyError) {
        console.error(
          `${LOG_PREFIX} Failed to fetch chat history:`,
          historyError,
        );
        // Continue without history if there's an error
      }

      // Convert chat history to UIMessage format
      const historyMessages: UIMessage[] = [];
      if (chatHistory && chatHistory.length > 0) {
        for (const message of chatHistory) {
          if (message.role === "user") {
            historyMessages.push({
              role: "user",
              parts: [
                {
                  type: "text",
                  text: message.plain_text || message.content,
                },
              ],
              id: message.message_id || crypto.randomUUID(),
            });
          } else if (message.role === "assistant") {
            historyMessages.push({
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: message.plain_text || message.content,
                },
              ],
              id: message.message_id || crypto.randomUUID(),
            });
          }
        }
      }

      // Check sandbox status and resume if needed
      console.log(`${LOG_PREFIX} Checking sandbox status for appId: ${appId}`);
      const { data: sandbox, error: sandboxError } = await supabase
        .from("user_sandboxes")
        .select("*")
        .eq("app_id", appId)
        .order("sandbox_updated_at", { ascending: false })
        .limit(1)
        .single();

      if (sandboxError) {
        throw new Error(
          `Failed to fetch sandbox status: ${sandboxError.message}`,
        );
      }

      if (!sandbox) {
        throw new Error("No sandbox found for this app");
      }

      // Update sandbox updated_at time
      await supabase
        .from("user_sandboxes")
        .update({ sandbox_updated_at: new Date().toISOString() })
        .eq("id", sandbox.id);

      // If sandbox is paused, resume it and wait for completion
      if (sandbox.sandbox_status === "paused") {
        console.log(`${LOG_PREFIX} Sandbox is paused, resuming...`);
        await resumeContainer.triggerAndWait({
          userId: sandbox.user_id,
          appId,
          appName: sandbox.app_name,
        });
        console.log(`${LOG_PREFIX} Sandbox is now active`);
      }

      // Get app details from the database
      const { data: app, error: appError } = await supabase
        .from("user_apps")
        .select("*")
        .eq("id", appId)
        .single();

      if (appError || !app) {
        throw new Error("Failed to fetch app details");
      }

      // Get file tree using e2b
      const fileTreeResponse = await getDirectoryTree(
        sandbox.sandbox_id,
        "/app/expo-app",
      );
      const fileTree = fileTreeResponse;

      // Initialize tools
      const tools = createTools({
        sandboxId: sandbox.sandbox_id,
      });

      // Create message with user prompt
      const messages: UIMessage[] = [];

      // Add history messages to the beginning of the messages array
      messages.push(...historyMessages);

      console.log(`${LOG_PREFIX} Chat history loaded:`, {
        sessionId,
        historyMessageCount: historyMessages.length,
        totalMessageCount: messages.length,
      });

      if (images && images.length > 0) {
        const userMessage = {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: userPrompt,
            },
            ...images.map((data) => ({
              type: "image" as const,
              image: data,
            })),
          ],
        };

        messages.push(userMessage as any);
      } else {
        // For text-only content
        messages.push({
          role: "user",
          parts: [
            {
              type: "text",
              text: userPrompt,
            },
          ],
          id: crypto.randomUUID(),
        });
      }

      // Insert user message into chat history AFTER building messages array
      const currentUserMessageId = messages[messages.length - 1].id;
      await supabase.from("app_chat_history").insert({
        app_id: appId,
        user_id: latestSession.user_id,
        metadata: {
          fromApp: true,
        },
        role: "user",
        model_used: modelName,
        plain_text: userPrompt,
        session_id: sessionId,
        message_id: currentUserMessageId,
        parts: messages[messages.length - 1].parts,
      });

      console.log(`${LOG_PREFIX} Starting generation:`, {
        appId,
        model: modelName,
        messageCount: messages.length,
        toolCount: tools.length,
      });

      // Get model configuration from helper function
      const { model: gatewayModel, order: providerOrder } =
        getModelAndOrder(modelName);

      // Generate response using Vercel AI SDK
      const result = await generateText({
        model: gateway(gatewayModel),
        providerOptions: {
          gateway: {
            order: providerOrder,
          },
        },
        messages: convertToModelMessages(messages),
        tools: tools,
        system: getPrompt(fileTree),
        stopWhen: stepCountIs(100),
      });

      // Calculate cost based on both input and output tokens
      const inputCost = result.usage?.inputTokens || 0 * 0.000003; // $3/million tokens
      const outputCost = result.usage?.outputTokens || 0 * 0.000015; // $15/million tokens
      const totalCost = inputCost + outputCost;
      let commitHash = null;
      try {
        const checkpointResponse = await saveCheckpoint(sandbox.sandbox_id, {
          branch: "master",
          message: "Checkpoint after AI assistant changes",
        });

        // Store the commit hash from the response
        commitHash = checkpointResponse.commit;
      } catch (error) {
        console.error("Failed to save checkpoint:", error);
        throw error;
      }
      // Insert assistant's message into chat history
      await supabase.from("app_chat_history").insert({
        app_id: appId,
        user_id: latestSession.user_id,
        role: "assistant",
        model_used: modelName,
        plain_text: result.text,
        input_tokens_used: result.usage?.inputTokens,
        output_tokens_used: result.usage?.outputTokens,
        cost: totalCost,
        session_id: sessionId,
        message_id: crypto.randomUUID(),
        commit_hash: commitHash,
        parts: result.content,
      });

      // Enhanced logging of the generation result
      console.log(`${LOG_PREFIX} Generation completed:`, {
        finishReason: result.finishReason,
        usage: {
          inputTokens: result.usage?.inputTokens,
          outputTokens: result.usage?.outputTokens,
          totalTokens: result.usage?.totalTokens,
        },
        hasReasoning: !!result.reasoning,
        toolCalls: result.toolCalls?.length || 0,
        toolResults: result.toolResults?.length || 0,
        steps: result.steps?.length || 0,
        warnings: result.warnings?.length || 0,
      });

      // Log the actual response text
      console.log(`${LOG_PREFIX} Response:`, result.text);

      // Log any warnings if present
      if (result.warnings?.length) {
        console.warn(`${LOG_PREFIX} Warnings:`, result.warnings);
      }

      // Log reasoning if available
      if (result.reasoning) {
        console.log(`${LOG_PREFIX} Reasoning:`, result.reasoning);
      }

      // Log cost calculation for both input and output tokens
      console.log(`${LOG_PREFIX} Cost Calculation:`, {
        inputTokens: result.usage?.inputTokens,
        outputTokens: result.usage?.outputTokens,
        inputCostPerToken: 0.000003,
        outputCostPerToken: 0.000015,
        inputCost,
        outputCost,
        totalCost,
      });

      // Set sandbox status back to active
      const { error: finalUpdateError } = await supabase
        .from("user_sandboxes")
        .update({ app_status: "active" })
        .eq("app_id", appId);

      if (finalUpdateError) {
        console.error(
          `${LOG_PREFIX} Failed to update sandbox status back to active:`,
          finalUpdateError,
        );
      }

      // Poll app status until ready, then send push notification
      console.log(
        `${LOG_PREFIX} Starting status polling for push notification...`,
      );

      const maxPollingAttempts = 20; // 20 attempts
      const pollingIntervalMs = 10000; // 10 seconds
      let pollingAttempt = 0;
      let isAppReady = false;
      let currentSandbox = null;

      while (pollingAttempt < maxPollingAttempts && !isAppReady) {
        pollingAttempt++;
        console.log(
          `${LOG_PREFIX} Status poll attempt ${pollingAttempt}/${maxPollingAttempts}`,
        );

        try {
          const { data: sandboxData, error: statusCheckError } = await supabase
            .from("user_sandboxes")
            .select("app_status, sandbox_status, expo_status")
            .eq("app_id", appId)
            .order("sandbox_updated_at", { ascending: false })
            .limit(1)
            .single();

          if (statusCheckError) {
            console.error(
              `${LOG_PREFIX} Failed to check app status on attempt ${pollingAttempt}:`,
              statusCheckError,
            );
            // Continue polling even if there's an error
            await new Promise((resolve) =>
              setTimeout(resolve, pollingIntervalMs),
            );
            continue;
          }

          currentSandbox = sandboxData;
          isAppReady =
            currentSandbox.app_status === "active" &&
            currentSandbox.sandbox_status === "active" &&
            currentSandbox.expo_status === "bundled";

          console.log(`${LOG_PREFIX} Status check ${pollingAttempt}:`, {
            app_status: currentSandbox.app_status,
            sandbox_status: currentSandbox.sandbox_status,
            expo_status: currentSandbox.expo_status,
            isReady: isAppReady,
          });

          if (isAppReady) {
            console.log(
              `${LOG_PREFIX} App is ready! Sending push notification...`,
            );
            break;
          }

          // Wait before next poll
          await new Promise((resolve) =>
            setTimeout(resolve, pollingIntervalMs),
          );
        } catch (error) {
          console.error(
            `${LOG_PREFIX} Error during status polling attempt ${pollingAttempt}:`,
            error,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, pollingIntervalMs),
          );
        }
      }

      if (!isAppReady) {
        console.log(
          `${LOG_PREFIX} App did not become ready within timeout period`,
        );
      }

      // Only send notification if app is ready
      if (isAppReady) {
        console.log("Sending push notification to the user");
        console.log("this is payload", {
          userId: latestSession.user_id,
          title: "MakeX",
          body: "Your App is ready to use.",
          payload: {
            appId,
            appName: app.app_name,
            appUrl: app.app_url,
          },
        });
        //send push notification to the user
        await sendPushNotifications({
          supabase,
          userId: latestSession.user_id,
          title: "MakeX",
          body: "Your App is ready to use.",
          payload: {
            appId,
            appName: app.app_name,
            appUrl: app.app_url,
          },
        });
      }

      return {
        success: true,
        response: result,
        sessionId,
      };
    } catch (error) {
      // Ensure we set the status back to active even if there's an error
      try {
        const supabase = await getSupabaseAdmin();
        await supabase
          .from("user_sandboxes")
          .update({ app_status: "active" })
          .eq("app_id", payload.appId);
      } catch (recoveryError) {
        console.error(
          `${LOG_PREFIX} Failed to recover sandbox status:`,
          recoveryError,
        );
      }

      console.error(`${LOG_PREFIX} Error:`, error);
      throw error;
    }
  },
});
