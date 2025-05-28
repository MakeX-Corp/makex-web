import { task } from "@trigger.dev/sdk/v3";
import { generateText, type Message } from "ai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createTools } from "@/utils/server/tool-factory";
import { getPrompt } from "@/utils/server/prompt";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { resumeContainer } from "./resume-container";

const LOG_PREFIX = "[AI Agent]";

export const aiAgent = task({
  id: "ai-agent",
  retry: {
    maxAttempts: 0
  },
  run: async (payload: { appId: string; userPrompt: string }) => {
    try {
      const { appId, userPrompt } = payload;

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
        throw new Error(`Failed to fetch latest session: ${sessionError.message}`);
      }

      if (!latestSession) {
        throw new Error("No session found for this app");
      }

      const sessionId = latestSession.id;

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
        throw new Error(`Failed to fetch sandbox status: ${sandboxError.message}`);
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

      // Update sandbox status to changing
      const { error: updateError } = await supabase
        .from("user_sandboxes")
        .update({ app_status: "changing" })
        .eq("app_id", appId);

      if (updateError) {
        throw new Error("Failed to update sandbox status");
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

      // Initialize API client
      const apiClient = createFileBackendApiClient(app.api_url);
      
      // Get file tree
      const fileTreeResponse = await apiClient.get("/file-tree", { path: "." });
      const fileTree = fileTreeResponse;

      // Initialize tools
      const tools = createTools({
        apiUrl: app.api_url,
      });

      // Initialize Bedrock client
      const bedrock = createAmazonBedrock({
        region: "us-east-1",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

      const model = bedrock("us.anthropic.claude-sonnet-4-20250514-v1:0");

      // Create message with user prompt
      const messages: Message[] = [{
        role: "user",
        content: userPrompt,
        id: crypto.randomUUID()
      }];

      // Insert user message into chat history
      await supabase.from("app_chat_history").insert({
        app_id: appId,
        user_id: latestSession.user_id,
        content: userPrompt,
        role: "user",
        model_used: "claude-sonnet-4",
        metadata: {
          streamed: false
        },
        session_id: sessionId,
        message_id: messages[0].id,
      });

      console.log(`${LOG_PREFIX} Starting generation:`, {
        appId,
        model: "claude-sonnet-4",
        messageCount: messages.length,
        toolCount: tools.length
      });

      // Generate response using Vercel AI SDK
      const result = await generateText({
        model: model,
        messages: messages,
        tools: tools,
        system: getPrompt(fileTree),
        maxSteps: 50,
      });

      // Calculate cost based on both input and output tokens
      const inputCost = result.usage?.promptTokens * 0.000003; // $3/million tokens
      const outputCost = result.usage?.completionTokens * 0.000015; // $15/million tokens
      const totalCost = inputCost + outputCost;

      // Insert assistant's message into chat history
      await supabase.from("app_chat_history").insert({
        app_id: appId,
        user_id: latestSession.user_id,
        content: result.text,
        role: "assistant",
        model_used: "claude-sonnet-4",
        metadata: {
          streamed: false,
          reasoning: result.reasoning,
          toolCalls: result.toolCalls,
          toolResults: result.toolResults
        },
        input_tokens_used: result.usage?.promptTokens,
        output_tokens_used: result.usage?.completionTokens,
        cost: totalCost,
        session_id: sessionId,
        message_id: crypto.randomUUID(),
      });

      // Enhanced logging of the generation result
      console.log(`${LOG_PREFIX} Generation completed:`, {
        finishReason: result.finishReason,
        usage: {
          promptTokens: result.usage?.promptTokens,
          completionTokens: result.usage?.completionTokens,
          totalTokens: result.usage?.totalTokens
        },
        hasReasoning: !!result.reasoning,
        toolCalls: result.toolCalls?.length || 0,
        toolResults: result.toolResults?.length || 0,
        steps: result.steps?.length || 0,
        warnings: result.warnings?.length || 0
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
        inputTokens: result.usage?.promptTokens,
        outputTokens: result.usage?.completionTokens,
        inputCostPerToken: 0.000003,
        outputCostPerToken: 0.000015,
        inputCost,
        outputCost,
        totalCost
      });

      // Set sandbox status back to active
      const { error: finalUpdateError } = await supabase
        .from("user_sandboxes")
        .update({ app_status: "active" })
        .eq("app_id", appId);

      if (finalUpdateError) {
        console.error(`${LOG_PREFIX} Failed to update sandbox status back to active:`, finalUpdateError);
      }

      return {
        success: true,
        response: result,
        sessionId
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
        console.error(`${LOG_PREFIX} Failed to recover sandbox status:`, recoveryError);
      }

      console.error(`${LOG_PREFIX} Error:`, error);
      throw error;
    }
  },
});
