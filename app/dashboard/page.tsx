"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { getAuthToken } from "@/utils/client/auth";

import { SubscriptionAuthWrapper } from "@/components/subscription-auth-wrapper";
interface UserApp {
  id: string;
  user_id: string;
  app_name: string;
  app_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [userApps, setUserApps] = useState<UserApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateApp = async () => {
    try {
      setIsLoading(true);

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
        const error = await response.json();
        throw new Error(error.error || "Failed to create app");
      }

      const newApp = await response.json();
      setUserApps((prev) => [...prev, newApp]);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    try {
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
    }
  };

  // Add useEffect to fetch initial user apps
  useEffect(() => {
    const fetchUserApps = async () => {
      try {
        const decodedToken = getAuthToken();

        if (!decodedToken) {
          throw new Error("No authentication token found");
        }

        const response = await fetch("/api/app", {
          headers: {
            Authorization: `Bearer ${decodedToken}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch apps");
        }

        const apps = await response.json();
        setUserApps(apps);
      } catch (error) {
        console.error("Error fetching apps:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching apps",
        });
      }
    };

    fetchUserApps();
  }, []);

  // Use the function passed from SubscriptionAuthWrapper, or fallback to a default
  const handleManageSubscription = () => {
    window.location.href = "/pricing";
  };

  return (
    <SubscriptionAuthWrapper requiredPlan="basic">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Apps</h1>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handleManageSubscription}>
              {"Manage Subscription"}
            </Button>
            <Button onClick={handleCreateApp} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? "Creating..." : "Create New App"}
            </Button>
          </div>
        </div>

        {userApps.length === 0 ? (
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
            {userApps.map((app) => (
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
            ))}
          </div>
        )}
      </div>
    </SubscriptionAuthWrapper>
  );
}
