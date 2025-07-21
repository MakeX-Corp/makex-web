"use client";

import { useEffect, useRef } from "react";

export function ConvexDashboardEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Hardcoded values for now
  const deploymentName = "accurate-rhinoceros-131";
  const deploymentUrl = `https://${deploymentName}.convex.cloud`;
  const adminKey =
    "accurate-rhinoceros-131|01c252cf473a15e8ff594eea6035435c8748df90def6f7544419a9c8daaa0c7edc0e02f243691f";

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "dashboard-credentials-request") return;
      iframeRef.current?.contentWindow?.postMessage(
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
  }, [deploymentName, deploymentUrl, adminKey]);

  return (
    <iframe
      ref={iframeRef}
      src="https://dashboard-embedded.convex.dev/data"
      style={{ width: "100%", height: "100%", border: "none" }}
      allow="clipboard-write"
    />
  );
}
