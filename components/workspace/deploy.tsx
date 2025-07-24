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
  Copy,
  Check,
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
  url: string;
  status: "uploading" | "completed" | "failed";
  created_at: string;
  error_message?: string;
}

interface ShareInfo {
  share_id: string;
  app_id: string;
  share_url: string;
  web_url: string;
  app_url: string;
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
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize Supabase client
  const supabase = createClient();

  // Reusable function to fetch share URL
  const fetchShareUrl = async (appId: string) => {
    try {
      const response = await fetch(`/api/share?app_id=${appId}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setShareInfo(data);
        }
      }
    } catch (error) {
      console.error("Error fetching share URL:", error);
    }
  };

  // Set up Supabase realtime subscription for deployment status
  useEffect(() => {
    if (!appId) return;

    // Initial fetch for last deployment
    const fetchLastDeployment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Always fetch share URL first
        await fetchShareUrl(appId);

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
            url: payload.new.url || "",
            status: payload.new.status,
            created_at: payload.new.created_at,
          });

          // If deployment is completed, fetch share info
          if (payload.new.status === "completed") {
            // Add a small delay to ensure backend is ready
            setTimeout(() => {
              fetchShareUrl(appId);
            }, 1000); // 1 second delay
          }
        },
      )
      .subscribe((status) => {});

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [appId, supabase]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

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
          body: JSON.stringify({ appId, type: "web" }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Deployment failed (${response.status})`,
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
    [apiUrl, appId],
  );

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
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* Deploy action buttons */}
        <DropdownMenuLabel>Deploy Options</DropdownMenuLabel>

        {!isLoading && !error && shareInfo && (
          <div className="px-2 py-1 text-sm">
            <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
              <span className="truncate flex-1">{shareInfo.share_url}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyToClipboard(shareInfo.share_url)}
                  className="p-1 hover:bg-muted rounded-sm transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <a
                  href={shareInfo.share_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-muted rounded-sm transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}

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
            <>Web</>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.open("https://discord.gg/3EsUgb53Zp", "_blank")}
          disabled={true}
          className="cursor-not-allowed opacity-50"
        >
          <img
            src={
              theme === "dark" ? "/icons/apple-dark.svg" : "/icons/apple.svg"
            }
            alt="App Store"
            className="h-4 w-4 mr-2"
          />
          App Store (Coming Soon)
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.open("https://discord.gg/3EsUgb53Zp", "_blank")}
          disabled={true}
          className="cursor-not-allowed opacity-50"
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
          Play Store (Coming Soon)
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
