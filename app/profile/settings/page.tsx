"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { getAuthToken } from "@/utils/client/auth";
import { useSubscription } from "@/hooks/use-subscription";

export default function ProfileSettings() {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const {
    hasActiveSubscription,
    pendingCancellation,
    planName,
    loading: subscriptionLoading,
  } = useSubscription();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || "");
        }
      } finally {
        setIsLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const handleManageSubscription = async () => {
    try {
      setIsManagingSubscription(true);
      const decodedToken = getAuthToken();

      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      // First fetch subscription data to get customer ID
      const subscriptionResponse = await fetch("/api/subscription", {
        headers: {
          Authorization: `Bearer ${decodedToken}`,
        },
      });

      if (!subscriptionResponse.ok) {
        const error = await subscriptionResponse.json();
        throw new Error(error.error || "Failed to fetch subscription data");
      }

      const subscriptionData = await subscriptionResponse.json();

      // If we don't have a customer ID, redirect to pricing
      if (!subscriptionData.customerId) {
        router.push("/pricing");
        return;
      }

      // Fetch customer session with customer ID
      const response = await fetch("/api/customer-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decodedToken}`,
        },
        body: JSON.stringify({
          customerId: subscriptionData.customerId,
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
    } finally {
      setIsManagingSubscription(false);
    }
  };

  if (isLoading || subscriptionLoading) {
    return (
      <div className="w-full max-w-2xl px-4">
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-4 w-20" />
              <div className="flex justify-center">
                <Skeleton className="h-10 w-[200px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl px-4">
      <div className="mb-4">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Email</h3>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Subscription</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current Plan: {planName}
                {pendingCancellation && " (Cancelling at period end)"}
              </p>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleManageSubscription}
                disabled={isManagingSubscription}
              >
                Manage Subscription
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="w-full max-w-[200px]"
                onClick={handleSignOut}
              >
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
