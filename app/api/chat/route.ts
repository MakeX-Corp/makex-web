import { anthropic,AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { streamText,tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import { getSupabaseWithUser } from '@/utils/server/auth';
import { NextResponse } from 'next/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the last user message
  const lastUserMessage = messages[messages.length - 1];
  
  // get appUrl from query params
  let appUrl = req.url.split('?')[1].split('=')[1];
  appUrl = appUrl.replace('makex.app', 'fly.dev');
  const API_BASE = appUrl + ':8001';

  const appId = req.url.split('?')[1].split('=')[2];


  const userResult = await getSupabaseWithUser(req)
  if (userResult instanceof NextResponse) return userResult
  const { supabase, user } = userResult


  let fullResponse = '';

  const modelName = 'claude-3-5-sonnet-latest';

  const result = streamText({
    model: anthropic(modelName),
    messages,
    // providerOptions: {
    //   anthropic: {
    //     thinking: { type: 'enabled', budgetTokens: 12000 },
    //   } satisfies AnthropicProviderOptions,
    // },
    tools: {      
      readFile: tool({
        description: 'Read contents of a file',
        parameters: z.object({
          path: z.string().describe('The path to the file to read'),
        }),
        execute: async ({ path }) => {
          const response = await axios.get(`${API_BASE}/file?path=${encodeURIComponent(path)}`);
          return response.data;
        },
      }),

      writeFile: tool({
        description: 'Write content to a file',
        parameters: z.object({
          path: z.string().describe('The path where to write the file'),
          content: z.string().describe('The content to write to the file'),
        }),
        execute: async ({ path, content }) => {
          const response = await axios.post(`${API_BASE}/file`, {
            path,
            content,
          });
          return response.data;
        },
      }),

      deleteFile: tool({
        description: 'Delete a file',
        parameters: z.object({
          path: z.string().describe('The path of the file to delete'),
        }),
        execute: async ({ path }) => {
          const response = await axios.delete(`${API_BASE}/file`, {
            data: { path },
          });
          return response.data;
        },
      }),

      replaceInFile: tool({
        description: 'Replace text in a file',
        parameters: z.object({
          path: z.string().describe('The path to the file'),
          find: z.string().describe('The text to find'),
          replace_with: z.string().describe('The text to replace with'),
        }),
        execute: async ({ path, find, replace_with }) => {
          const response = await axios.put(`${API_BASE}/file/replace`, {
            path,
            find,
            replace_with,
          });
          return response.data;
        },
      }),
    },
    onChunk: ({ chunk }) => {
      if (chunk.type === 'text-delta') {
        fullResponse += chunk.textDelta;
      }
    },
    onFinish: async (result) => {

      const inputTokens = result.usage.promptTokens;
      const outputTokens = result.usage.completionTokens;
      const inputCost = inputTokens * 0.000003;
      const outputCost = outputTokens * 0.000015;

      
      // Insert user's last message into chat history
      await supabase.from('app_chat_history').insert({
        app_id: appId,
        user_id: user.id,
        content: lastUserMessage.content,
        role: 'user',
        model_used: modelName,
        metadata: { streamed: false },
        input_tokens_used: inputTokens,
        output_tokens_used: 0,
        cost: inputCost

      });
      
      // Insert assistant's response into chat history
      await supabase.from('app_chat_history').insert({
        app_id: appId,
        user_id: user.id,
        content: fullResponse,
        role: 'assistant',
        model_used: modelName,
        metadata: { streamed: true },
        input_tokens_used: 0,
        output_tokens_used: outputTokens,
        cost: outputCost
      });
    },
    maxSteps: 5, // allow up to 5 steps
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}