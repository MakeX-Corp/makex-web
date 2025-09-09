"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

import { initPaddle } from "@/utils/server/paddle-client";

import { useToast } from "@/components/ui/use-toast";
import { PRICING_PLANS } from "@/const";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/context/AppContext";

// Using pricing configuration from constants
const plans = PRICING_PLANS;

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
      paddle.Checkout.open({
        settings: {
          theme: "light",
          displayMode: "overlay",
          successUrl: `${window.location.origin}/dashboard`,
        },
        items: [
          {
            priceId,
            quantity: 1,
          },
        ],
        customData: {
          userId: subscription?.userId,
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initiate checkout",
      });
    } finally {
      setIsLoading(null);
    }
  };

  // Check if button should be disabled for the current plan
  const isButtonDisabled = (priceId: string) => {
    // Find the current plan based on planName
    const currentPlan = plans.find(
      (plan) => plan.name === subscription?.planName,
    );

    // Disable the button for the current plan
    if (
      subscription?.hasActiveSubscription &&
      currentPlan &&
      currentPlan.priceId === priceId
    ) {
      return true;
    }

    return isLoading === priceId;
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Pricing Plans
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Choose the perfect plan to power your app creation journey
        </p>
      </div>

      {subscriptionLoading ? (
        <PricingSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.planName === plan.name;
            const isFreePlan = plan.name === "Free";

            return (
              <Card
                key={plan.name}
                className={`flex flex-col ${
                  isCurrentPlan ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    {isCurrentPlan && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">
                      /{plan.interval}
                    </span>
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
                  {isFreePlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      {isCurrentPlan ? "Current Plan" : "Free Plan"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleCheckout(plan.priceId)}
                      disabled={isButtonDisabled(plan.priceId)}
                    >
                      {isLoading === plan.priceId
                        ? "Processing..."
                        : isCurrentPlan
                        ? "Current Plan"
                        : "Subscribe"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}

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
                <span className="text-4xl font-bold text-muted-foreground">
                  Custom
                </span>
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
                  window.open(
                    "mailto:contact@makex.app?subject=Enterprise%20Inquiry",
                    "_blank",
                  )
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
