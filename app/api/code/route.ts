import { getSupabaseWithUser } from '@/utils/server/auth';
import { NextResponse } from 'next/server';
import { createFileBackendApiClient } from '@/utils/file-backend-api-client';

// Add this function to handle checkpoint restore
export async function POST(request: Request) {
  const { messageId, appUrl, sessionId } = await request.json();

  console.log("message", messageId);
  console.log("appUrl", appUrl);
  console.log("sessionId", sessionId);
  
  // Transform the URL similar to chat route
  let apiUrl = appUrl.replace('makex.app', 'fly.dev');
  const API_BASE = apiUrl + ':8001';

  // query supabase app_chat_history to get the commit hash
  const userResult = await getSupabaseWithUser(request)
  if (userResult instanceof NextResponse) return userResult
  const { supabase, user } = userResult
  const { data, error } = await supabase
    .from('app_chat_history')
    .select('commit_hash')
    .eq('id', messageId)
    .eq('user_id', user.id)
    .eq('session_id', sessionId)
    .single();
  
  if (error) {
    return NextResponse.json(
      { error: 'Failed to get commit hash' },
      { status: 500 }
    );
  }

  console.log("data", data);
  const fileBackendClient = createFileBackendApiClient(API_BASE);
  
  
  try {
    const responseData = await fileBackendClient.post('/checkpoint/restore', { 
      name: data.commit_hash,
    });
    
    console.log("responseData", responseData);
    
    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to restore checkpoint' },
      { status: 500 }
    );
  }
}






