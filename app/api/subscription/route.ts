import { NextResponse } from 'next/server';
import { getSupabaseWithUser } from '@/utils/server/auth';
import { Subscription } from '@/utils/db-schema';

export async function GET(request: Request) {
  const result = await getSupabaseWithUser(request);
  
  if (result instanceof NextResponse) {
    return result;
  }
  
  const { supabase, user } = result;
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data || null);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
