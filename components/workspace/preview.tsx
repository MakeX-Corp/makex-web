"use client";
import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, Smartphone, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/session-context";
import { QRCodeDisplay } from "@/components/qr-code";
import MobileMockup from "@/components/mobile-mockup";
import { getAuthToken } from "@/utils/client/auth";

interface PreviewProps {
  iframeKey: string; // Key to force iframe refresh
  isRefreshing: boolean; // Loading state
  onRefresh: () => void; // Refresh function from parent
}

export function Preview({ iframeKey, isRefreshing, onRefresh }: PreviewProps) {
  const [viewMode, setViewMode] = useState<"mobile" | "qr">("mobile");
  const { appId, appUrl, appName } = useSession();
  const [containerState, setContainerState] = useState<"starting" | "live">("starting");
  const authToken = getAuthToken();

  const createSandbox = async () => {
    try {
      const response = await fetch("/api/sandbox", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          appId,
          appName,
        }),
      });
      if (response.status === 201 || response.status === 200) {
        setContainerState("live");
      }
    } catch (error) {
      console.error("Error creating sandbox:", error);
    }
  };

  useEffect(() => {
    // get the current container state by hitting /sandbox
    const fetchContainerState = async () => {
      try {
        const response = await fetch(`/api/sandbox?appId=${appId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (response.status === 200) {
          setContainerState("live");
        }
        else if (response.status === 404) {
          // call the create sandbox endpoint
          await createSandbox();
        }
      } catch (error) {
        console.error("Error fetching container state:", error);
      }
    };

    if (appName && appId && authToken) {
      fetchContainerState();
    }
  }, [appName, appId, authToken]);


  return (
    <Card className="h-full border rounded-md">
      <CardContent className="relative h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-background">
            <button
              onClick={() => setViewMode("mobile")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === "mobile"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <span className="hidden sm:inline">Mockup</span>
              <Smartphone className="sm:hidden h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("qr")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === "qr"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <span className="hidden sm:inline">View in Mobile</span>
              <QrCode className="sm:hidden h-4 w-4" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => appUrl && window.open(appUrl, "_blank")}
              className="h-6 px-2 flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`ml-2 px-3 py-1 text-xs capitalize font-semibold border rounded-full flex items-center justify-center select-none pointer-events-none shadow-none
    ${containerState === "starting"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : containerState === "live"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }
  `}
              style={{ minWidth: 70, textAlign: "center" }}
            >
              {containerState}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={onRefresh}
              className={isRefreshing ? "animate-spin" : ""}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {viewMode === "mobile" ? (
            <div className="h-full w-full flex items-center justify-center">
              <MobileMockup
                appUrl={appUrl || ""}
                iframeKey={iframeKey}
                containerState={containerState}
              />
            </div>
          ) : (
            <div className="h-full w-full rounded-lg p-4 overflow-auto flex items-center justify-center">
              <QRCodeDisplay url={appUrl || ""} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
