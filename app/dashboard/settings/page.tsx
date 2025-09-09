"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, LogOut, Globe, Check, CreditCard } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getPlanFeatures, getPlanPrice } from "@/const";

// Using plan utility functions from constants

export default function ProfileSettings() {
  const router = useRouter();
  const { subscription, isLoading: subscriptionLoading, user } = useApp();
  const { toast } = useToast();

  // Derive values from the subscription data
  const planName = subscription?.planName || "Free";
  const customerId = subscription?.customerId || null;
  const email = user?.email || "";
  const initials = email ? email.substring(0, 2).toUpperCase() : "US";
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Get plan features and price from environment variables
  const planFeatures = getPlanFeatures(planName);
  const planPrice = getPlanPrice(planName);

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    return subscription?.hasActiveSubscription;
  };

  // Check if user is on free plan
  const isOnFreePlan = () => {
    return (
      !subscription?.hasActiveSubscription || subscription?.planName === "Free"
    );
  };

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

      // If we don't have a customer ID or on free plan, redirect to pricing
      if (!customerId || isOnFreePlan()) {
        router.push("/dashboard/pricing");
        return;
      }

      // Get customer portal URL from our API
      const response = await fetch("/api/customer-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Open the customer portal URL
        window.open(data.url, "_blank");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to open customer portal",
        });
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open customer portal",
      });
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
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isOnFreePlan()
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {planName} Plan
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
            {isOnFreePlan() ? "Upgrade" : "Change Plan"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="font-medium">{planName} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  {isOnFreePlan()
                    ? "Upgrade to access premium features."
                    : planName === "Starter"
                    ? "Access to some premium features."
                    : "Full access to all premium features."}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {planName === "Free" ? "Free" : `$${planPrice}/month`}
                </p>
                {hasActiveSubscription() && subscription?.nextBillingDate && (
                  <p className="text-xs text-muted-foreground">
                    {isOnFreePlan()
                      ? `Message count resets: ${new Date(
                          subscription.nextBillingDate,
                        ).toLocaleDateString()}`
                      : `Next billing: ${new Date(
                          subscription.nextBillingDate,
                        ).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </div>

            {/* Subscription Features */}
            {!isOnFreePlan() && planFeatures.length > 0 && (
              <div className="mb-6">
                <div className="bg-muted/50 rounded-md p-4">
                  <h4 className="font-medium mb-3">Plan Features</h4>
                  <ul className="space-y-2">
                    {planFeatures.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant={isOnFreePlan() ? "default" : "outline"}
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isManagingSubscription}
              >
                {isManagingSubscription ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isOnFreePlan() ? (
                  "Upgrade Now"
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </>
                )}
              </Button>

              {hasActiveSubscription() && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Need help? Contact us at{" "}
                    <a
                      href="mailto:contact@makex.app"
                      className="text-primary hover:underline"
                    >
                      contact@makex.app
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
