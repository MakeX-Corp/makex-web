"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

import { initPaddle } from "@/utils/server/paddle-client";

import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/context/AppContext";

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
    name: process.env.NEXT_PUBLIC_FREE_PLAN_NAME || "Free",
    description: process.env.NEXT_PUBLIC_FREE_PLAN_DESCRIPTION || "For people just starting out",
    price: process.env.NEXT_PUBLIC_FREE_PLAN_PRICE || "0",
    interval: "month",
    features: (
      process.env.NEXT_PUBLIC_FREE_PLAN_FEATURES ||
      "20 messages a month, Slower app start times, Discord support"
    )
      .split(",")
      .map((feature) => feature.trim()),
    priceId: "",
  },
  {
    name: process.env.NEXT_PUBLIC_STARTER_PLAN_NAME || "Starter",
    description:
      process.env.NEXT_PUBLIC_STARTER_PLAN_DESCRIPTION ||
      "Perfect for individuals starting with AI app creation",
    price: process.env.NEXT_PUBLIC_STARTER_PLAN_PRICE || "9.99",
    interval: "month",
    features: (
      process.env.NEXT_PUBLIC_STARTER_PLAN_FEATURES ||
      "250 messages a month,Basic AI editing,Faster app start times,Priority support,Publish to App Store and Google Play (coming soon)"
    )
      .split(",")
      .map((feature) => feature.trim()),
    priceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_ID || "",
  },
];

const PricingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {[1, 2].map((i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="mb-6">
              <Skeleton className="h-10 w-20" />
            </div>
            <ul className="space-y-2">
              {[1, 2, 3, 4].map((j) => (
                <li key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-3/4" />
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default function PricingPage() {
  const { subscription, isLoading: subscriptionLoading } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    console.log("priceId", priceId);
    const paddle = await initPaddle();
    if (!paddle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Payment processor not available",
      });
      return;
    }

    try {
      setIsLoading(priceId);
      if (subscription?.hasActiveSubscription) {
        console.log("hasActiveSubscription", subscription?.hasActiveSubscription);
        // Handle upgrade/downgrade for existing subscription
        const updateResponse = await fetch("/api/subscription/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionId: subscription?.subscription?.id,
            priceId: priceId,
          }),
        });
        const result = await updateResponse.json();

        if (result.success) {
          toast({
            title: "Success",
            description: "Your subscription has been updated.",
          });
          // Redirect to dashboard or success page
          window.location.href = `${window.location.origin}/dashboard`;
        } else {
          throw new Error(result.error || "Failed to update subscription");
        }
      } else {
        console.log("priceId", priceId);
        const checkout = paddle.Checkout.open({
          items: [
            {
              priceId: priceId,
              quantity: 1,
            },
          ],
          customData: {
            userId: subscription?.userId,
          },
          settings: {
            successUrl: `${window.location.origin}/dashboard`,
          },
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to initiate checkout",
      });
    } finally {
      setIsLoading(null);
    }
  };

  // Check if button should be disabled for the current plan
  const isButtonDisabled = (priceId: string) => {
    // Find the current plan based on planName
    const currentPlan = plans.find((plan) => plan.name === subscription?.planName);

    // Disable the button for the current plan
    if (subscription?.hasActiveSubscription && currentPlan && currentPlan.priceId === priceId) {
      return true;
    }

    return isLoading === priceId;
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Pricing Plans</h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Choose the perfect plan to power your app creation journey
        </p>
      </div>

      {subscriptionLoading ? (
        <PricingSkeleton />
      ) : (
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
                {plan?.name !== "Free" && (
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout(plan.priceId)}
                    disabled={isButtonDisabled(plan.priceId)}
                  >
                    {isLoading === plan.priceId
                      ? "Processing..."
                      : subscription?.hasActiveSubscription && subscription?.planName === plan.name
                        ? "Current Plan"
                        : "Subscribe"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}

          {/* Contact Us Card */}
          <Card className="flex flex-col border-dashed">
            <CardHeader>
              <CardTitle className="text-2xl">
                {process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_NAME || "Enterprise"}
              </CardTitle>
              <p className="text-muted-foreground">
                {process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_DESCRIPTION ||
                  "Need higher limits? Contact us for custom solutions"}
              </p>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold text-muted-foreground">Custom</span>
              </div>
              <ul className="space-y-2">
                {(
                  process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_FEATURES ||
                  "Advanced AI editing,Priority support,Custom integrations,Dedicated account manager"
                )
                  .split(",")
                  .map((feature) => feature.trim())
                  .map((feature) => (
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
                variant="outline"
                onClick={() =>
                  window.open("mailto:contact@makex.app?subject=Enterprise%20Inquiry", "_blank")
                }
              >
                Contact Us
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
