"use client";

import { useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  Smartphone,
  QrCode,
  Code,
  Database,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/session-context";
import { QRCodeDisplay } from "@/components/qr-code";
import MobileMockup from "@/components/mobile-mockup";
import CodeView from "./code-view";
import { ConvexDashboardEmbed } from "./convex-dashboard";

interface PreviewProps {
  iframeKey: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  state: any;
}

export function Preview({
  iframeKey,
  isRefreshing,
  onRefresh,
  state,
}: PreviewProps) {
  const [viewMode, setViewMode] = useState<"mobile" | "qr" | "code" | "convex">(
    "mobile"
  );
  const [convexLoaded, setConvexLoaded] = useState(false); // NEW
  const { appUrl } = useSession();

  const switchView = (mode: typeof viewMode) => {
    setViewMode(mode);
    if (mode === "convex" && !convexLoaded) setConvexLoaded(true); // mount once
  };

  return (
    <Card className="h-full border rounded-md">
      <CardContent className="relative h-full flex flex-col p-4">
        {/* toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-background">
            {/* buttons */}
            <button
              onClick={() => switchView("mobile")}
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
              onClick={() => switchView("qr")}
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
              onClick={() => switchView("code")}
              className={`h-6 px-2 flex items-center gap-1 ${
                viewMode === "code"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => switchView("convex")}
              className={`h-6 px-2 flex items-center gap-1 ${
                viewMode === "convex"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => appUrl && window.open(appUrl, "_blank")}
              className="h-6 px-2 flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          {/* status + refresh */}
          <div className="flex items-center gap-2">
            <Badge
              className={`ml-2 px-3 py-1 text-xs capitalize font-semibold border rounded-full flex items-center justify-center select-none pointer-events-none shadow-none ${
                state?.sandbox_status === "starting"
                  ? "bg-blue-200 text-blue-800 border-blue-300"
                  : state?.sandbox_status === "active"
                  ? "bg-green-200 text-green-800 border-green-300"
                  : state?.sandbox_status === "paused"
                  ? "bg-red-200 text-red-800 border-red-300"
                  : state?.sandbox_status === "resuming"
                  ? "bg-green-100 text-green-600 border-green-200"
                  : state?.sandbox_status === "pausing"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }`}
              style={{ minWidth: 70, textAlign: "center" }}
            >
              {state?.sandbox_status}
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

        {/* content */}
        <div className="flex-1 overflow-auto">
          {viewMode === "mobile" && state && (
            <div className="h-full w-full flex items-center justify-center">
              <MobileMockup
                appUrl={appUrl || ""}
                iframeKey={iframeKey}
                state={state}
              />
            </div>
          )}

          {viewMode === "qr" && (
            <div className="h-full w-full rounded-lg p-4 flex items-center justify-center">
              <QRCodeDisplay url={appUrl || ""} />
            </div>
          )}

          {viewMode === "code" && (
            <div className="h-full w-full">
              <CodeView />
            </div>
          )}

          {/* keep iframe mounted; just hide/show */}
          {convexLoaded && (
            <div
              className="h-full w-full rounded-lg overflow-hidden"
              style={{ display: viewMode === "convex" ? "block" : "none" }}
            >
              <ConvexDashboardEmbed />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
