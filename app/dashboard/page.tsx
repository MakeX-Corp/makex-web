"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { getAuthToken } from "@/utils/client/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DiscordSupportButton } from "@/components/support-button";

interface UserApp {
  id: string;
  user_id: string;
  app_name: string;
  app_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ContainerLimitError {
  error: string;
  currentCount: number;
  maxAllowed: number;
}

// This is a child component that will be rendered inside the SubscriptionAuthWrapper
export default function Dashboard() {
  const [userApps, setUserApps] = useState<UserApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [deletingAppIds, setDeletingAppIds] = useState<Set<string>>(new Set());
  const [limitError, setLimitError] = useState<ContainerLimitError | null>(
    null
  );
  const { toast } = useToast();
  const router = useRouter();

  const handleManageSubscription = async () => {
    try {
      const decodedToken = getAuthToken();

      if (!decodedToken) {
        throw new Error("No authentication token found");
      }
      // If we don't have a customer ID, redirect to pricing
      if (!customerId) {
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
          customerId: customerId,
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
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while managing your subscription",
      });
      // Fallback to pricing page on error
      router.push("/pricing");
    }
  };

  const handleCreateApp = async () => {
    try {
      // Clear any previous limit errors
      setLimitError(null);

      const decodedToken = getAuthToken();

      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decodedToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check if this is a container limit error
        if (
          response.status === 400 &&
          errorData.currentCount !== undefined &&
          errorData.maxAllowed !== undefined
        ) {
          setLimitError(errorData as ContainerLimitError);
          throw new Error(errorData.error);
        }

        throw new Error(errorData.error || "Failed to create app");
      }

      const newApp = await response.json();
      setUserApps((prev) => [...prev, newApp]);

      toast({
        title: "Success",
        description: "New app created successfully!",
      });
    } catch (error) {
      console.error("Error creating app:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the app",
      });
    }
  };

  const handleDeleteApp = async (appId: string) => {
    try {
      // Set this app as deleting to show skeleton
      setDeletingAppIds((prev) => new Set([...prev, appId]));

      const decodedToken = getAuthToken();

      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/app?id=${appId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${decodedToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete app");
      }

      setUserApps((prev) => prev.filter((app) => app.id !== appId));

      // Clear any limit errors if they exist
      if (limitError) {
        setLimitError(null);
      }

      toast({
        title: "Success",
        description: "App deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting app:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the app",
      });
    } finally {
      // Remove this app from the deleting set
      setDeletingAppIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }
  };

  // Fetch initial user apps and subscription data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const decodedToken = getAuthToken();

        if (!decodedToken) {
          throw new Error("No authentication token found");
        }

        // Fetch user apps
        const appsResponse = await fetch("/api/app", {
          headers: {
            Authorization: `Bearer ${decodedToken}`,
          },
        });

        if (!appsResponse.ok) {
          const error = await appsResponse.json();
          throw new Error(error.error || "Failed to fetch apps");
        }

        const apps = await appsResponse.json();
        console.log(apps);
        setUserApps(apps);

        // Fetch subscription data to get customer ID
        const subscriptionResponse = await fetch("/api/subscription", {
          headers: {
            Authorization: `Bearer ${decodedToken}`,
          },
        });

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          // Save the customer ID for later use
          console.log(subscriptionData);
          if (subscriptionData && subscriptionData.customerId) {
            setCustomerId(subscriptionData.customerId);
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Add this new component for the skeleton loading state
  const AppCardSkeleton = () => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Apps</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleManageSubscription}>
            Manage Subscription
          </Button>
          <Button onClick={handleCreateApp} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Create New App
          </Button>
        </div>
      </div>

      {limitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Container Limit Reached</AlertTitle>
          <AlertDescription>
            You have reached your maximum limit of {limitError.maxAllowed}{" "}
            container{limitError.maxAllowed !== 1 ? "s" : ""}. Please delete an
            existing app before creating a new one, or upgrade your subscription
            for more containers.
          </AlertDescription>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => setLimitError(null)}
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <AppCardSkeleton key={index} />
          ))}
        </div>
      ) : userApps.length === 0 ? (
        <Card className="p-8">
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You haven't created any apps yet
            </p>
            <Button onClick={handleCreateApp}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First App
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userApps.map((app) =>
            deletingAppIds.has(app.id) ? (
              <AppCardSkeleton key={app.id} />
            ) : (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-2">{app.app_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                  {app.app_url && (
                    <p className="text-sm text-muted-foreground truncate">
                      URL: {app.app_url}
                    </p>
                  )}
                  <div className="mt-4 space-y-2">
                    <Link href={`/ai-editor/${app.id}`}>
                      <Button variant="outline" className="w-full">
                        Edit App
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleDeleteApp(app.id)}
                    >
                      Delete App
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      <DiscordSupportButton />
    </div>
  );
}
