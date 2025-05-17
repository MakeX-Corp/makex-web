"use client";
import { useState, useCallback, useEffect } from "react";
import {
  Globe,
  Loader2,
  UploadCloud,
  Clock,
  ExternalLink,
  AlertTriangle,
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

interface Deployment {
  id: string;
  url: string;
  status: string;
  created_at: string;
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

  // Fetch last deployment function with better error handling
  const fetchLastDeployment = useCallback(async () => {
    if (!appId) return;

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
      console.log("sdsdsds", data);
      setLastDeployment(data);
    } catch (err) {
      console.error("Error fetching deployment:", err);
      setError("Failed to load deployment info");
    } finally {
      setIsLoading(false);
    }
  }, [appId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchLastDeployment();
  }, [fetchLastDeployment]);

  // Deploy web function with improved error handling
  const deployWeb = useCallback(async () => {
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

      if (data.url) {
        setLastDeployment({
          id: data.deploymentId,
          url: data.url,
          status: "completed",
          created_at: new Date().toISOString(),
        });
      } else {
        // Background deployment started
        setTimeout(fetchLastDeployment, 3000); // Check again after a delay
      }
    } catch (error: any) {
      console.error("Error deploying app:", error);
      setError(error.message || "Failed to deploy app");
    } finally {
      setIsDeploying(false);
    }
  }, [apiUrl, appId, fetchLastDeployment]);

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

  return (
    <DropdownMenu>
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
          className="cursor-pointer"
          onClick={deployWeb}
          disabled={isDeploying}
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deploying to web...
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 mr-2" />
              Deploy to web
            </>
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
                <span
                  className={`${
                    lastDeployment.status === "completed"
                      ? "text-green-500"
                      : "text-amber-500"
                  }`}
                >
                  {lastDeployment.status === "completed"
                    ? "Completed"
                    : "In Progress"}
                </span>
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="font-medium">Deployed at:</span>
                <span className="text-muted-foreground">
                  {formatTime(lastDeployment.created_at)}
                </span>
              </div>
            </div>

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

            <DropdownMenuItem
              className="cursor-pointer mt-1"
              onClick={() => {
                navigator.clipboard.writeText(lastDeployment.url);
              }}
            >
              Copy deployment URL
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
