"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, User, CreditCard, LogOut, Moon, Globe } from "lucide-react";
import { getAuthToken } from "@/utils/client/auth";
import { useApp } from "@/context/AppContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfileSettings() {
  const router = useRouter();
  const { subscription, isLoading: subscriptionLoading } = useApp();

  // Derive values from the subscription data
  const pendingCancellation = subscription?.pendingCancellation || false;
  const planName = subscription?.planName || "";
  const customerId = subscription?.customerId || null;
  const email = subscription?.email || "";
  const initials = email ? email.substring(0, 2).toUpperCase() : "US";

  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClientComponentClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleManageSubscription = async () => {
    try {
      setIsManagingSubscription(true);
      const decodedToken = getAuthToken();

      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      // If we don't have a customer ID, redirect to pricing
      if (!customerId || planName === "Free") {
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
          customerId,
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
      router.push("/pricing");
    } finally {
      setIsManagingSubscription(false);
    }
  };

  if (isSigningOut) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (subscriptionLoading) {
    return (
      <div className="w-full max-w-4xl px-4">
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
    <div className="w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-bold ml-4">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar with avatar and tabs */}
        <div className="md:col-span-3">
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-col items-center space-y-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-medium">{email}</p>
                  <p className="text-sm text-muted-foreground">
                    {planName} Plan
                    {pendingCancellation && " (Cancelling)"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Button
                  variant={activeTab === "account" ? "default" : "ghost"}
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setActiveTab("account")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Account
                </Button>
                <Button
                  variant={activeTab === "billing" ? "default" : "ghost"}
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setActiveTab("billing")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Button>
              </div>

              <Separator className="my-6" />

              <Button
                variant="outline"
                className="w-full justify-center"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="md:col-span-9">
          {/* Account Tab */}
          {activeTab === "account" && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Manage your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Email Address</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <p className="text-xs text-muted-foreground">
                    This is the email address associated with your account.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Account Type</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{planName} Plan</p>
                      <p className="text-xs text-muted-foreground">
                        {pendingCancellation
                          ? "Your subscription will be cancelled at the end of the current billing period."
                          : planName === "Free"
                          ? "Upgrade to access premium features."
                          : "Access to all premium features."}
                      </p>
                    </div>
                    <Button
                      variant={planName === "Free" ? "default" : "outline"}
                      size="sm"
                      onClick={() => router.push("/pricing")}
                    >
                      {planName === "Free" ? "Upgrade" : "Change Plan"}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Language and Region</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">English (US)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>
                  Manage your subscription and payment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Current Plan</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium">{planName} Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {pendingCancellation && "Cancelling at period end"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {planName === "Free"
                            ? "Free"
                            : planName === "Starter"
                            ? "$10/month"
                            : "$20/month"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                    >
                      {isManagingSubscription ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Manage Subscription"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
