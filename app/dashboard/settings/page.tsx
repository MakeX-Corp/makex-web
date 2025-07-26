"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, LogOut, Globe } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
export default function ProfileSettings() {
  const router = useRouter();
  const { subscription, isLoading: subscriptionLoading, user } = useApp();

  // Derive values from the subscription data
  const pendingCancellation = subscription?.pendingCancellation || false;
  const planName = subscription?.planName || "";
  const customerId = subscription?.customerId || null;
  const email = user?.email || "";
  const initials = email ? email.substring(0, 2).toUpperCase() : "US";
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error during sign out:", error);
        throw error;
      }
      setTimeout(() => {
        console.log("Redirecting to homepage...");
        //router.push("/");
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Failed to sign out:", error);
      setIsSigningOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsManagingSubscription(true);

      // If we don't have a customer ID, redirect to pricing
      if (!customerId || planName === "Free") {
        router.push("/dashboard/pricing");
        return;
      }
      // Fetch customer session with customer ID
      const response = await fetch("/api/customer-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        router.push("/dashboard/pricing");
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
      router.push("/dashboard/pricing");
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
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-52 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-secondary/80"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="mb-6 overflow-hidden border-none shadow-sm bg-gradient-to-br from-background to-muted">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold mb-1">{email}</h2>
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    planName === "Free"
                      ? "bg-muted text-muted-foreground"
                      : pendingCancellation
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {planName} Plan
                  {pendingCancellation && " (Cancelling)"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Account Information</h2>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-medium">{email}</p>
                </div>
              </div>

              {/* Language Settings */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Language & Region
                </label>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">English (US)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  ></Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Subscription Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Subscription & Billing</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/pricing")}
          >
            {planName === "Free" ? "Upgrade" : "Change Plan"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="font-medium">{planName} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingCancellation
                    ? "Your subscription will be cancelled at the end of the current billing period."
                    : planName === "Free"
                      ? "Upgrade to access premium features."
                      : planName === "Starter"
                        ? "Access to some premium features."
                        : "Full access to all premium features."}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {planName === "Free"
                    ? "Free"
                    : planName === "Starter"
                      ? "$19/month"
                      : "$49/month"}
                </p>
              </div>
            </div>

            {/* Subscription Features */}
            {planName !== "Free" && (
              <div className="mb-6">
                <div className="bg-muted/50 rounded-md p-4">
                  <ul className="space-y-2">
                    {planName === "Starter" ? (
                      <>
                        <li className="flex items-center gap-2 text-sm">
                          <svg
                            className="h-5 w-5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          250 messages per month
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <svg
                            className="h-5 w-5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Publish to App Store and Google Play (coming soon)
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <svg
                            className="h-5 w-5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Priority support
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2 text-sm">
                          <svg
                            className="h-5 w-5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          500 messages per month
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <svg
                            className="h-5 w-5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Advanced AI editing
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <svg
                            className="h-5 w-5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          1-1 support
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}

            <Button
              variant={planName === "Free" ? "default" : "outline"}
              className="w-full"
              onClick={handleManageSubscription}
              disabled={isManagingSubscription}
            >
              {isManagingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : planName === "Free" ? (
                "Upgrade Now"
              ) : (
                "Manage Subscription"
              )}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
