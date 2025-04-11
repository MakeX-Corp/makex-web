import { anthropic,AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { streamText,tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import { getSupabaseWithUser } from '@/utils/server/auth';
import { NextResponse } from 'next/server';

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
    const sessionId = searchParams.get('sessionId');
    const appId = searchParams.get('appId');

    if (!sessionId || !appId) {
      return NextResponse.json(
        { error: 'Session ID and App ID are required' },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user and app
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('app_id', appId)
      .eq('user_id', user.id)
      .single();

      

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('app_chat_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('app_id', appId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { messages, appUrl, appId, sessionId } = await req.json();
  // Get the last user message
  const lastUserMessage = messages[messages.length - 1];
  
  // get appUrl from query params
  let apiUrl = appUrl.replace('makex.app', 'fly.dev');
  const API_BASE = apiUrl + ':8001';


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
        cost: inputCost,
        session_id: sessionId,

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
        cost: outputCost,
        session_id: sessionId,
      });
    },
    maxSteps: 5, // allow up to 5 steps
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}