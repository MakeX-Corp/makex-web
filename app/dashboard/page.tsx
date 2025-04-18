"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Lock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { getAuthToken, getUserEmailFromToken } from "@/utils/client/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DiscordSupportButton } from "@/components/support-button";
import { Input } from "@/components/ui/input";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import posthog from "posthog-js";
const INVITE_CODE_REQUIRED = true;
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

export default function Dashboard() {
  const [userApps, setUserApps] = useState<UserApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [deletingAppIds, setDeletingAppIds] = useState<Set<string>>(new Set());
  const [limitError, setLimitError] = useState<ContainerLimitError | null>(
    null
  );
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeVerified, setInviteCodeVerified] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const verifyInviteCode = async () => {
    if (!inviteCode.trim()) return;

    setInviteError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Check if invite code exists and is valid
      const { data, error } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", inviteCode)
        .single();

      if (error || !data) {
        setInviteError("Invalid invite code");
        return;
      }

      // Check if code is already used
      if (data.user_id) {
        setInviteError("This invite code has already been used");
        return;
      }

      // Assign the invite code to this user
      try {
        const { data: updateData, error: updateError } = await supabase
          .from("invite_codes")
          .update({ user_id: user.id })
          .eq("code", inviteCode)
          .select();

        console.log(updateData);
        console.log(updateError);
      } catch (error) {
        console.error("Error updating invite code:", error);
        throw new Error("Failed to update invite code");
      }

      // Success! Invite code verified
      setInviteCodeVerified(true);
      setIsLoading(true);

      // Now fetch user apps
      fetchUserApps();
    } catch (error) {
      console.error("Error verifying invite code:", error);
      setInviteError(
        error instanceof Error
          ? error.message
          : "An error occurred while verifying the invite code"
      );
    }
  };

  const fetchUserApps = async () => {
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
      setUserApps(apps);
    } catch (error) {
      console.error("Error fetching user apps:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching apps",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApp = async () => {
    try {
      setIsCreatingApp(true);
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
          return;
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
    } finally {
      setIsCreatingApp(false);
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
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const decodedToken = getAuthToken();

        if (!decodedToken) {
          throw new Error("No authentication token found");
        }

        const userEmail = getUserEmailFromToken(decodedToken);
        if (userEmail) {
          posthog.identify(userEmail, {
            email: userEmail,
            has_apps: userApps.length > 0,
            app_count: userApps.length,
          });
        }

        // If invite code system is enabled, check verification first
        if (INVITE_CODE_REQUIRED) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            router.push("/login");
            return;
          }

          // Check if this user already has a verified invite code
          const { data } = await supabase
            .from("invite_codes")
            .select("*")
            .eq("user_id", user.id)
            .single();

          // If no verified code, stop loading and show invite input
          if (!data) {
            setInviteCodeVerified(false);
            setIsLoading(false);
            return;
          }

          // Code verified, continue to load apps
          setInviteCodeVerified(true);
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
        setUserApps(apps);
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

  // If the invite code hasn't been verified yet, show the invite code screen
  if (!inviteCodeVerified && !isLoading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-6">
              <Lock className="h-12 w-12 text-primary mb-4" />
              <h1 className="text-2xl font-bold text-center">
                Access Required
              </h1>
              <p className="text-muted-foreground text-center mt-2">
                Enter your invite code to access the dashboard
              </p>
            </div>

            {inviteError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inviteError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="inviteCode" className="text-sm font-medium">
                  Invite Code
                </label>
                <Input
                  id="inviteCode"
                  placeholder="Enter your invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      verifyInviteCode();
                    }
                  }}
                />
              </div>

              <Button
                className="w-full"
                onClick={verifyInviteCode}
                disabled={!inviteCode.trim()}
              >
                Verify Invite Code
              </Button>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Need an invite code? Join Discord !
              </p>
            </div>
          </CardContent>
        </Card>
        <DiscordSupportButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Apps</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleCreateApp}
            disabled={isLoading || isCreatingApp}
          >
            {isCreatingApp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create New App
              </>
            )}
          </Button>
        </div>
      </div>

      {limitError && (
        <Dialog open={!!limitError} onOpenChange={() => setLimitError(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>App Limit Reached</DialogTitle>
              <DialogDescription>
                You have reached your maximum limit of {limitError.maxAllowed}{" "}
                app
                {limitError.maxAllowed !== 1 ? "s" : ""}. Please delete an
                existing app before creating a new one, or upgrade your
                subscription for more apps.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/pricing">View Pricing Plans</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            <Button
              onClick={handleCreateApp}
              disabled={isLoading || isCreatingApp}
            >
              {isCreatingApp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First App
                </>
              )}
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
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => setEditingAppId(app.id)}
                        disabled={editingAppId === app.id}
                      >
                        {editingAppId === app.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          "Edit App"
                        )}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
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
