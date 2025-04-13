import { NextResponse } from 'next/server';
import { getSupabaseWithUser } from '@/utils/server/auth';
import { createFileBackendApiClient } from '@/utils/file-backend-api-client';

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const userResult = await getSupabaseWithUser(request)
    if (userResult instanceof NextResponse) return userResult
    const { supabase, user } = userResult

    const body = await request.json();
    const {
      content,
      appUrl, 
      appId, 
      sessionId,
      outputTokens,
      messageId,
    } = body;

    console.log("===============AI MESSAGE SAVE===================");
    console.log("messageId", messageId);
    console.log("content", content);
    console.log("================================================");

    const apiUrl = appUrl.replace('makex.app', 'fly.dev');
    const API_BASE = apiUrl + ':8001';

    let commitHash = null;

    const apiClient = createFileBackendApiClient(API_BASE);
        // Save checkpoint after completing the response
        try {
            const checkpointResponse = await apiClient.post('/checkpoint/save', {
              name: 'ai-assistant-checkpoint',
              message: 'Checkpoint after AI assistant changes'
            });
            
            console.log('checkpointResponse', checkpointResponse);
            // Store the commit hash from the response
            commitHash = checkpointResponse.commit || checkpointResponse.current_commit;
          } catch (error) {
            console.error('Failed to save checkpoint:', error);
          }

    // Calculate cost based on output tokens
    const outputCost = outputTokens * 0.000015;


    // Insert assistant's message into chat history
    await supabase.from('app_chat_history').insert({
      app_id: appId,
      user_id: user.id, // Use authenticated user's ID
      content: content,
      role: 'assistant',
      model_used: 'claude-3-5-sonnet-latest',
      metadata: { 
        streamed: true,
      },
      input_tokens_used: 0,
      output_tokens_used: outputTokens,
      cost: outputCost,
      session_id: sessionId,
      commit_hash: commitHash,
      message_id: messageId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving AI message:', error);
    return NextResponse.json({ error: 'Failed to save AI message' }, { status: 500 });
  }
}
