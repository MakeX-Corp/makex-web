import { Button } from "../ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { useState } from "react";
import { QRCodeDisplay } from "@/components/qr-code";
import MobileMockup from "@/components/mobile-mockup";

interface AppDetails {
  id: string;
  user_id: string;
  app_name: string;
  app_url: string | null;
  api_url: string | null;
  machine_id: string | null;
  created_at: string;
  updated_at: string;
  sandbox_id: string | null;
  sandbox_status: string | null;
  supabase_project: any;
}
export const Preview = () => {
  const [viewMode, setViewMode] = useState<"mobile" | "qr">("mobile");
  const [app, setApp] = useState<AppDetails | null>({
    app_url: "https://example.com",
    api_url: "https://api.example.com",
    id: "123",
    user_id: "123",
    app_name: "Example App",
    machine_id: "123",
    created_at: "2021-01-01",
    updated_at: "2021-01-01",
    sandbox_id: "123",
    sandbox_status: "active",
    supabase_project: null,
  });
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<string | null>(null);

  const handleRefresh = () => {
    setIframeKey(Math.random().toString(36).substring(2, 15));
  };
  const appId = "123";
  return (
    <Card className="w-1/2 bg-card">
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
              Mockup
            </button>
            <button
              onClick={() => setViewMode("qr")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === "qr"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              View in Mobile
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => app.app_url && window.open(app.app_url, "_blank")}
              className="h-6 px-2 flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1">
          {viewMode === "mobile" ? (
            <div className="h-full w-full flex items-center justify-center">
              <MobileMockup
                appId={appId}
                appUrl={app.app_url || ""}
                iframeKey={iframeKey}
                authToken={authToken || ""}
              />
            </div>
          ) : (
            <div className="h-full w-full rounded-lg p-4 overflow-auto flex items-center justify-center">
              <QRCodeDisplay url={app.app_url || ""} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
