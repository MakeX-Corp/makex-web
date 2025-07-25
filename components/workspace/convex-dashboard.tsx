"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useSession } from "@/context/session-context";
import { Loader2 } from "lucide-react";

//iframe for dev and prod
function DashboardFrame({
  adminKey,
  deploymentUrl,
  deploymentName,
}: {
  adminKey: string;
  deploymentUrl: string;
  deploymentName: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type !== "dashboard-credentials-request" ||
        event.source !== iframeRef.current?.contentWindow
      )
        return;

      (event.source as Window).postMessage(
        {
          type: "dashboard-credentials",
          adminKey,
          deploymentUrl,
          deploymentName,
        },
        "*",
      );
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [adminKey, deploymentUrl, deploymentName]);

  return (
    <iframe
      ref={iframeRef}
      src="https://dashboard-embedded.convex.dev/data"
      style={{ width: "100%", height: "100%", border: "none" }}
      allow="clipboard-write"
    />
  );
}

export function ConvexDashboardEmbed() {
  const session = useSession();
  const { appId, convexConfig: contextConvexConfig } = session;
  const [convexConfig, setConvexConfig] = useState<{
    devUrl: string | null;
    projectId: string | null;
    devAdminKey: string | null;
    prodUrl: string | null;
    prodAdminKey: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [env, setEnv] = useState<"dev" | "prod">("dev");
  const [credentialsReady, setCredentialsReady] = useState(false);

  // Helper to check if a config is complete
  const isConfigComplete = (cfg: any) =>
    cfg && cfg.devUrl && cfg.projectId && cfg.devAdminKey;

  const [delayDone, setDelayDone] = useState(false);

  useEffect(() => {
    if (!appId) return;
    // If context config is complete, use it and skip API call
    if (isConfigComplete(contextConvexConfig)) {
      setConvexConfig(contextConvexConfig);
      setLoading(false);
      setError(null);
      setCredentialsReady(true);
      return;
    }
    // Otherwise, fetch from API
    setLoading(true);
    setError(null);
    fetch(`/api/app?id=${appId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch app info");
        return res.json();
      })
      .then((data) => {
        const config = {
          devUrl: data.convex_dev_url || null,
          projectId: data.convex_project_id || null,
          devAdminKey: data.convex_dev_admin_key || null,
          prodUrl: data.convex_prod_url || null,
          prodAdminKey: data.convex_prod_admin_key || null,
        };
        setConvexConfig(config);

        if (isConfigComplete(config)) {
          setCredentialsReady(true);
        }
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
      })
      .finally(() => setLoading(false));
  }, [appId, contextConvexConfig]);

  // ⏱️ Wait 3s after credentialsReady before rendering iframe
  useEffect(() => {
    if (!credentialsReady) return;
    const timer = setTimeout(() => setDelayDone(true), 3000);
    return () => clearTimeout(timer);
  }, [credentialsReady]);
  if (!appId) {
    return null;
  }
  if (loading || !convexConfig) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  if (!credentialsReady || !delayDone) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-foreground">Error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const prodAvailable = Boolean(
    convexConfig &&
      convexConfig.prodUrl &&
      convexConfig.projectId &&
      convexConfig.prodAdminKey,
  );

  if (!isConfigComplete(convexConfig)) {
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 p-2 border-b">
        <span className="text-sm font-medium text-muted-foreground">
          Environment:
        </span>
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-3 text-xs ${
              env === "dev"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setEnv("dev")}
          >
            Dev
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-3 text-xs ${
              env === "prod"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setEnv("prod")}
          >
            Prod
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {env === "dev" && (
          <DashboardFrame
            key="dev"
            adminKey={convexConfig.devAdminKey!}
            deploymentUrl={convexConfig.devUrl!}
            deploymentName={convexConfig.projectId!}
          />
        )}

        {env === "prod" &&
          (prodAvailable ? (
            <DashboardFrame
              key="prod"
              adminKey={convexConfig.prodAdminKey!}
              deploymentUrl={convexConfig.prodUrl!}
              deploymentName={convexConfig.projectId!}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">
                  Production Not Deployed
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your app hasn't been deployed to production yet. Deploy it to
                  see the production Convex dashboard here.
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
