import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getAuthToken } from "@/utils/client/auth";

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  current_period_end: string;
  price_id: string;
  customer_id: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface SubscriptionResponse {
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  pendingCancellation: boolean;
  expiresAt: string | null;
  planId: string | null;
  customerId: string | null;
  userId: string | null;
}

interface UseSubscriptionReturn {
  hasActiveSubscription: boolean;
  pendingCancellation: boolean;
  loading: boolean;
  error: string | null;
  userId: string | null;
  planName: string;
  subscriptionId: string | null;
  refetch: () => Promise<void>;
}

const getPlanName = (planId: string | null): string => {
  if (!planId) return "Free";
  switch (planId) {
    case process.env.NEXT_PUBLIC_PADDLE_STARTER_ID:
      return "Starter";
    case process.env.NEXT_PUBLIC_PADDLE_PRO_ID:
      return "Pro";
    case process.env.NEXT_PUBLIC_PADDLE_ENTERPRISE_ID:
      return "Enterprise";
    default:
      return "Free";
  }
};

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] =
    useState<boolean>(false);
  const [pendingCancellation, setPendingCancellation] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscription = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch("/api/subscription", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const data: SubscriptionResponse = await response.json();

      setSubscription(data.subscription);
      setHasActiveSubscription(data.hasActiveSubscription);
      setPendingCancellation(data.pendingCancellation);
      setUserId(data.userId);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subscription data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadSubscription = async () => {
      if (mounted) {
        await fetchSubscription();
      }
    };

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, [toast]);

  return {
    hasActiveSubscription,
    pendingCancellation,
    loading,
    error,
    userId,
    planName: getPlanName(subscription?.price_id || null),
    subscriptionId: subscription?.id || null,
    refetch: fetchSubscription,
  };
}
