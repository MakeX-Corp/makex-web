"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/utils/client/auth";
import { Button } from "./ui/button";
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

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const decodedToken = getAuthToken();

        if (!decodedToken) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/subscription", {
          headers: {
            Authorization: `Bearer ${decodedToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch subscription status");
        }

        const data = await response.json();
        console.log(data);
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
    return <div>Loading...</div>;
  }

  // If no subscription is required, render children
  if (!requiredPlan) {
    return <>{children}</>;
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
  return <>{children}</>;
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
  if (planId.includes("pri_01jrgq0gf89e4xae6060s53j80")) return 1; // basic
  if (planId.includes("pri_01h9whhq7pg7qmgz7dnbpdz155")) return 2; // pro
  if (planId.includes("pri_01h9whhq7pg7qmgz7dnbpdz156")) return 3; // enterprise
  return 0;
}
