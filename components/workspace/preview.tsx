"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, Smartphone, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/session-context";
import { QRCodeDisplay } from "@/components/qr-code";
import MobileMockup from "@/components/mobile-mockup";

export function Preview({ authToken }: { authToken: string }) {
  const [viewMode, setViewMode] = useState<"mobile" | "qr">("mobile");
  const { appId, appName, appUrl, apiUrl } = useSession();
  const [iframeKey, setIframeKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIframeKey(Math.random().toString(36).substring(2, 15));

    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <Card className="h-full border rounded-md">
      <CardContent className="relative h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-background">
            <button
              onClick={() => setViewMode("mobile")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === "mobile"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="hidden sm:inline">Mockup</span>
              <Smartphone className="sm:hidden h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("qr")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === "qr"
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
          <div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleRefresh}
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
                appId={appId || ""}
                appUrl={appUrl || ""}
                iframeKey={iframeKey}
                authToken={authToken || ""}
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
