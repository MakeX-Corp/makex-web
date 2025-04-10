import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('Paddle-Signature');
    const payload = await request.json();
    
    
    const event = payload.data;
    const eventType = payload.event_type;
    
    console.log('Received webhook:', eventType, event);
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }
    
    switch (eventType) {
      case 'subscription.created':
        await handleSubscriptionCreated(event, supabase);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event, supabase);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event, supabase);
        break;
      case 'transaction.completed':
        await handleTransactionCompleted(event, supabase);
        break;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(event: any, supabase: any) {
  const userId = event.passthrough?.userId;
  if (!userId) return;
  
  try {
    await supabase.from('subscriptions').insert({
      id: event.id,
      user_id: userId,
      status: event.status,
      price_id: event.price.id,
      quantity: event.quantity,
      cancel_at_period_end: event.cancel_at_period_end,
      canceled_at: event.canceled_at,
      current_period_start: event.current_period_start,
      current_period_end: event.current_period_end,
      created_at: event.created_at
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
  }
}

async function handleSubscriptionUpdated(event: any, supabase: any) {
  try {
    await supabase.from('subscriptions').update({
      status: event.status,
      price_id: event.price.id,
      quantity: event.quantity,
      cancel_at_period_end: event.cancel_at_period_end,
      canceled_at: event.canceled_at,
      current_period_start: event.current_period_start,
      current_period_end: event.current_period_end
    }).eq('id', event.id);
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionCanceled(event: any, supabase: any) {
  try {
    await supabase.from('subscriptions').update({
      status: 'canceled',
      canceled_at: event.canceled_at,
      cancel_at_period_end: true
    }).eq('id', event.id);
  } catch (error) {
    console.error('Error canceling subscription:', error);
  }
}

async function handleTransactionCompleted(event: any, supabase: any) {
  try {
    await supabase.from('transactions').insert({
      id: event.id,
      user_id: event.customer.user_id,
      subscription_id: event.subscription_id,
      price_id: event.price.id,
      status: event.status,
      payment_method: event.payment_method,
      amount: event.total,
      currency: event.currency_code,
      created_at: event.created_at
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
  }
}
