export interface Price {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  interval: 'month' | 'year' | null;
  currency: string;
  amount: number;
  feature_limits: Record<string, number>;
  features: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  price_id: string;
  quantity: number;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  subscription_id: string;
  price_id: string;
  status: 'complete' | 'refunded' | 'pending';
  payment_method: string;
  amount: number;
  currency: string;
  created_at: string;
}
