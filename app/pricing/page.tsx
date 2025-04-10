'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { initPaddle } from '@/utils/paddle-client';
import { getAuthToken } from '@/utils/client/auth';
import { useToast } from '@/components/ui/use-toast';

interface PlanProps {
  name: string;
  description: string;
  price: string;
  interval: string;
  features: string[];
  priceId: string;
}

const plans: PlanProps[] = [
  {
    name: 'Starter',
    description: 'Perfect for individuals starting with AI app creation',
    price: '10',
    interval: 'month',
    features: ['3 apps', 'Basic AI editing', 'Standard support'],
    priceId: 'pri_01h9whhq7pg7qmgz7dnbpdz154' // Replace with actual Paddle price ID
  },
  {
    name: 'Pro',
    description: 'For professionals who need more power',
    price: '29',
    interval: 'month',
    features: ['10 apps', 'Advanced AI editing', 'Priority support', 'Custom domains'],
    priceId: 'pri_01h9whkskgp7s4jy9n8a8ph37b' // Replace with actual Paddle price ID
  }
];

export default function PricingPage() {
  const [paddle, setPaddle] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPaddle(initPaddle());
  }, []);

  const handleCheckout = async (priceId: string) => {
    if (!paddle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Payment processor not available"
      });
      return;
    }

    try {
      setLoading(priceId);
      const token = getAuthToken();
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const checkout = await paddle.Checkout.open({
        items: [{
          priceId: priceId,
          quantity: 1
        }],
        successUrl: `${window.location.origin}/dashboard?checkout_success=true`,
        customerEmail: '', // This could be prefilled if you have the user's email
        passthrough: { userId: token }, // Pass user data to webhook
      });

      console.log('Checkout created:', checkout);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to initiate checkout"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Pricing Plans</h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Choose the perfect plan to power your app creation journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleCheckout(plan.priceId)}
                disabled={loading === plan.priceId}
              >
                {loading === plan.priceId ? 'Processing...' : 'Subscribe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
