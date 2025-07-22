"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useSession } from "@/context/session-context";

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
        "*"
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
  const {
    convexDevUrl,
    convexProjectId,
    convexDevAdminKey,
    convexProdUrl,
    convexProdAdminKey,
  } = useSession();

  console.log("convexDevUrl", convexDevUrl);
  console.log("convexProjectId", convexProjectId);
  console.log("convexDevAdminKey", convexDevAdminKey);
  console.log("convexProdUrl", convexProdUrl);
  console.log("convexProdAdminKey", convexProdAdminKey);
  const [env, setEnv] = useState<"dev" | "prod">("dev");

  const devAvailable =
    convexDevUrl && convexProjectId && convexDevAdminKey ? true : false;
  const prodAvailable =
    convexProdUrl && convexProjectId && convexProdAdminKey ? true : false;

  if (!devAvailable) {
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
            disabled={!prodAvailable}
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
            adminKey={convexDevAdminKey!}
            deploymentUrl={convexDevUrl!}
            deploymentName={convexProjectId!}
          />
        )}

        {env === "prod" &&
          (prodAvailable ? (
            <DashboardFrame
              key="prod"
              adminKey={convexProdAdminKey!}
              deploymentUrl={convexProdUrl!}
              deploymentName={convexProjectId!}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">
                  Production Not Deployed
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your app hasn’t been deployed to production yet. Deploy it to
                  see the production Convex dashboard here.
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
