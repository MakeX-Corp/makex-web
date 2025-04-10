'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getAuthToken } from '@/utils/client/auth';
import { Subscription } from '@/utils/db-schema';
import { initPaddle } from '@/utils/paddle-client';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paddle, setPaddle] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPaddle(initPaddle());
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        window.location.href = '/login';
        return;
      }
      
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subscription details"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || !paddle) return;
    
    try {
      setCancelLoading(true);
      
      await paddle.Subscription.cancel(subscription.id);
      
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled"
      });
      
      fetchSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel subscription"
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
      
      {loading ? (
        <div className="text-center p-8">Loading subscription details...</div>
      ) : !subscription ? (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4">You don't have an active subscription.</p>
            <Button onClick={() => window.location.href = '/pricing'}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Status</p>
                  <p className="capitalize">{subscription.status}</p>
                </div>
                <div>
                  <p className="font-medium">Billing Period</p>
                  <p>{formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</p>
                </div>
              </div>
              
              {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                <div className="mt-6">
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your subscription will remain active until the end of the current billing period.
                  </p>
                </div>
              )}
              
              {subscription.cancel_at_period_end && (
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <p>
                    Your subscription is canceled and will end on {formatDate(subscription.current_period_end)}.
                  </p>
                  <Button 
                    className="mt-2" 
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Renew Subscription
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
