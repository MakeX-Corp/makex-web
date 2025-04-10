'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/utils/client/auth';
import { Subscription } from '@/utils/db-schema';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        if (!token) return;
        
        const response = await fetch('/api/subscription', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-8 w-28 bg-gray-200 rounded"></div>;
  }

  if (!subscription) {
    return (
      <Button variant="outline" size="sm" onClick={() => window.location.href = '/pricing'}>
        Upgrade Plan
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={subscription.status === 'active' ? 'default' : 'outline'}>
        {subscription.status === 'active' ? 'Active Plan' : 'Plan: ' + subscription.status}
      </Badge>
      <Button variant="link" size="sm" onClick={() => window.location.href = '/account/billing'}>
        Manage
      </Button>
    </div>
  );
}
