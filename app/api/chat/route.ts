import { anthropic,AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { streamText,tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();
  // get appUrl from query params
  const appUrl = req.url.split('?')[1].split('=')[1];
  const API_BASE = appUrl + ':8001';

  const result = streamText({
    model: anthropic('claude-3-7-sonnet-20250219'),
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
    maxSteps: 5, // allow up to 5 steps
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}