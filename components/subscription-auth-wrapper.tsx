"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, decodeToken } from "@/utils/client/auth";
import { Button } from "./ui/button";
import posthog from "posthog-js";
// Very simple context with just the function we need
const SubscriptionContext = createContext({
  handleManageSubscription: () => {},
});

// Export the hook for components to use
export const useSubscriptionActions = () => useContext(SubscriptionContext);

interface SubscriptionAuthWrapperProps {
  children: React.ReactNode;
  requiredPlan?: "basic" | "pro" | "enterprise";
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: any;
  pendingCancellation: boolean;
  expiresAt: string | null;
  planId: string | null;
  customerId: string | null;
}

export function SubscriptionAuthWrapper({
  children,
  requiredPlan,
}: SubscriptionAuthWrapperProps) {
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // The function we want to expose to children
  const handleManageSubscription = async () => {
    try {
      if (!subscriptionStatus?.customerId) {
        // If no customer ID exists, redirect to pricing page
        router.push("/pricing");
        return;
      }

      // Make API call using the customer_id
      const decodedToken = getAuthToken();
      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/customer-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decodedToken}`,
        },
        body: JSON.stringify({
          customerId: subscriptionStatus?.customerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to manage subscription");
      }

      const data = await response.json();

      // Redirect to the subscription portal URL returned from the API
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        router.push("/pricing");
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
      // Fallback to pricing page on error
      router.push("/pricing");
    }
  };

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const token = getAuthToken();

        if (!token) {
          router.push("/login");
          return;
        }
        const decodedToken = decodeToken(token);
        const email = decodedToken.email;

        // Identify user in PostHog
        posthog.identify(email, {
          email: email,
          subscription_status: subscriptionStatus?.hasActiveSubscription,
          subscription_plan: subscriptionStatus?.planId,
          customer_id: subscriptionStatus?.customerId,
        });

        const response = await fetch("/api/subscription", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch subscription status");
        }

        const data = await response.json();
        setSubscriptionStatus(data);
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [router]);

  if (isLoading) {
    return <div>Loading..</div>;
  }

  // If no subscription is required, render children with context
  if (!requiredPlan) {
    return (
      <SubscriptionContext.Provider value={{ handleManageSubscription }}>
        {children}
      </SubscriptionContext.Provider>
    );
  }

  // If subscription is required but user doesn't have one
  if (!subscriptionStatus?.hasActiveSubscription) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-xl font-semibold">Subscription Required</h2>
        <p className="text-muted-foreground">
          You need a subscription to access this feature.
        </p>
        <Button onClick={() => router.push("/pricing")}>
          {"Get Subscription"}
        </Button>
      </div>
    );
  }

  // If subscription is required and user has one, check plan level
  const hasRequiredPlan = checkPlanLevel(
    subscriptionStatus?.planId,
    requiredPlan
  );

  if (!hasRequiredPlan) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-xl font-semibold">Upgrade Required</h2>
        <p className="text-muted-foreground">
          This feature requires a {requiredPlan} plan or higher.
        </p>
        <Button onClick={() => router.push("/pricing")}>
          {"Manage Subscription"}
        </Button>
      </div>
    );
  }

  // Provide subscription management function to children
  return (
    <SubscriptionContext.Provider value={{ handleManageSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

function checkPlanLevel(
  currentPlanId: string | null,
  requiredPlan: string
): boolean {
  const planLevels = {
    basic: 1,
    pro: 2,
    enterprise: 3,
  };

  if (!currentPlanId) return false;

  const currentPlanLevel = getPlanLevelFromId(currentPlanId);
  const requiredPlanLevel = planLevels[requiredPlan as keyof typeof planLevels];
  return currentPlanLevel >= requiredPlanLevel;
}

function getPlanLevelFromId(planId: string): number {
  if (planId === process.env.NEXT_PUBLIC_PADDLE_STARTER_ID) return 1; // basic
  if (planId === process.env.NEXT_PUBLIC_PADDLE_PRO_ID) return 2; // pro
  if (planId === process.env.NEXT_PUBLIC_PADDLE_ENTERPRISE_ID) return 3; // enterprise
  return 0;
}
