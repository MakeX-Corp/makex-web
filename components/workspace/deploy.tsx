"use client";
import { useState, useCallback, useEffect } from "react";
import {
  Globe,
  Loader2,
  UploadCloud,
  Clock,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";

interface Deployment {
  id: string;
  url: string;
  status: "uploading" | "completed" | "failed";
  created_at: string;
  error_message?: string;
}

export function DeployButton({
  appId,
  apiUrl,
}: {
  appId: string | null;
  apiUrl: string;
}) {
  const { theme } = useTheme();
  const [isDeploying, setIsDeploying] = useState(false);
  const [lastDeployment, setLastDeployment] = useState<Deployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Initialize Supabase client
  const supabase = createClient();

  // Set up Supabase realtime subscription for deployment status
  useEffect(() => {
    if (!appId) return;

    // Initial fetch for last deployment
    const fetchLastDeployment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/code/deploy?appId=${appId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // No deployments yet - this is fine
            setLastDeployment(null);
            return;
          }
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setLastDeployment(data);
      } catch (err) {
        console.error("Error fetching deployment:", err);
        setError("Failed to load deployment info");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastDeployment();

    // Set up realtime subscription
    const channel = supabase
      .channel(`realtime:user_deployments:${appId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_deployments",
          filter: `app_id=eq.${appId}`,
        },
        (payload) => {
          // Update local state with deployment info
          setLastDeployment({
            id: payload.new.id,
            url: payload.new.url || "",
            status: payload.new.status,
            created_at: payload.new.created_at,
          });
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.error("Failed to subscribe to deployment updates");
        }
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [appId, supabase]);

  // Deploy web function with improved error handling
  const deployWeb = useCallback(
    async (e: React.MouseEvent) => {
      // Prevent the dropdown from closing
      e.preventDefault();
      e.stopPropagation();

      setIsDeploying(true);
      setError(null);

      try {
        const response = await fetch("/api/code/deploy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiUrl, appId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Deployment failed (${response.status})`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Unknown deployment error");
        }

        // Update local state for immediate feedback
        const newDeployment = {
          id: data.deploymentId,
          url: data.url || "",
          status: "uploading" as const,
          created_at: new Date().toISOString(),
        };

        setLastDeployment(newDeployment);
      } catch (error: any) {
        console.error("Error deploying app:", error);
        setError(error.message || "Failed to deploy app");
      } finally {
        setIsDeploying(false);
      }
    },
    [apiUrl, appId]
  );

  // Format URL for display
  const formatUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, h:mm a");
    } catch {
      return "Unknown time";
    }
  };

  // Get status icon based on deployment status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "uploading":
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
    }
  };

  // Get status text based on deployment status
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-green-500">Completed</span>;
      case "failed":
        return <span className="text-red-500">Failed</span>;
      case "uploading":
      default:
        return <span className="text-amber-500">Uploading</span>;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          <span>Deploy</span>
          {isLoading && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* Deploy action buttons */}
        <DropdownMenuLabel>Deploy Options</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={deployWeb}
          disabled={isDeploying}
          className="cursor-pointer"
        >
          <Globe className="h-4 w-4 mr-2" />
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deploying to web...
            </>
          ) : (
            <>Deploy to web</>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.open("https://discord.gg/3EsUgb53Zp", "_blank")}
        >
          <img
            src={
              theme === "dark" ? "/icons/apple-dark.svg" : "/icons/apple.svg"
            }
            alt="App Store"
            className="h-4 w-4 mr-2"
          />
          Deploy to App Store
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open("https://discord.gg/3EsUgb53Zp", "_blank")}
        >
          <img
            src={
              theme === "dark"
                ? "/icons/play-store-dark.svg"
                : "/icons/play-store.svg"
            }
            alt="Play Store"
            className="h-4 w-4 mr-2"
          />
          Deploy to Play Store
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Last deployment section */}
        <DropdownMenuLabel className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Last Deployment
        </DropdownMenuLabel>

        {isLoading && (
          <div className="px-2 py-3 text-sm flex items-center justify-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading deployment info...
          </div>
        )}

        {!isLoading && error && (
          <div className="px-2 py-3 text-sm flex items-center text-amber-500">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {!isLoading && !error && !lastDeployment && (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            No previous deployments found
          </div>
        )}

        {!isLoading && !error && lastDeployment && (
          <>
            <div className="px-2 py-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(lastDeployment.status)}
                  {getStatusText(lastDeployment.status)}
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="font-medium">Deployed at:</span>
                <span className="text-muted-foreground">
                  {formatTime(lastDeployment.created_at)}
                </span>
              </div>

              {lastDeployment.status === "failed" &&
                lastDeployment.error_message && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-sm text-xs">
                    <div className="font-medium mb-1">Error:</div>
                    {lastDeployment.error_message}
                  </div>
                )}
            </div>

            {lastDeployment.url && lastDeployment.status === "completed" && (
              <>
                <DropdownMenuItem
                  className="cursor-pointer mt-1 flex items-center justify-between"
                  onClick={() => window.open(lastDeployment.url, "_blank")}
                >
                  <span className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    {formatUrl(lastDeployment.url)}
                  </span>
                  <ExternalLink className="h-3 w-3 ml-2" />
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
