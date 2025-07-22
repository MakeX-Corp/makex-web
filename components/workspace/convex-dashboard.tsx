"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/context/session-context";

export function ConvexDashboardEmbed() {
  const { convexDevUrl, convexProjectId, convexDevAdminKey } = useSession();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Always call the hook, then guard inside it
  useEffect(() => {
    if (!convexDevUrl || !convexProjectId || !convexDevAdminKey) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "dashboard-credentials-request") return;

      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "dashboard-credentials",
          adminKey: convexDevAdminKey,
          deploymentUrl: convexDevUrl,
          deploymentName: convexProjectId,
        },
        "*"
      );
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [convexDevUrl, convexProjectId, convexDevAdminKey]);

  // Render nothing until creds are available
  if (!convexDevUrl || !convexProjectId || !convexDevAdminKey) return null;

  return (
    <iframe
      ref={iframeRef}
      src="https://dashboard-embedded.convex.dev/data"
      style={{ width: "100%", height: "100%", border: "none" }}
      allow="clipboard-write"
    />
  );
}
