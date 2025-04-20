"use client";

import { ReactNode, useEffect, useState } from "react";
import { use } from "react";
import { SessionSelector } from "@/components/workspace/session-selector";
import { useApp } from "@/context/AppContext"; // Import the updated useApp hook

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  // Unwrap params using React.use() to fix the Next.js warning
  //const unwrappedParams = use(params);
  // Type assertion to tell TypeScript that unwrappedParams has an appId property
  //const appId = (unwrappedParams as { appId: string }).appId;

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    isLoading,
    apps,
    currentAppId,
  } = useApp();
  console.log("sessions", sessions);
  console.log("currentSessionId", currentSessionId);
  console.log("isLoading", isLoading);

  const unwrappedParams = use(params);
  // Type assertion to tell TypeScript that unwrappedParams has an appId property
  const appId = (unwrappedParams as { appId: string }).appId;
  // Flag to track if we've tried to set the initial session
  const [initializedSession, setInitializedSession] = useState(false);

  // Set initial session or create one if needed - only run when sessions are available and we haven't initialized yet
  useEffect(() => {
    const initializeSession = async () => {
      // Only proceed if sessions are loaded and we haven't already initialized
      if (!isLoading && !initializedSession) {
        if (sessions.length > 0 && !currentSessionId) {
          // Set the first session as current if we have sessions but no current one selected
          console.log("sessions[0].id", sessions[0].id);
          setCurrentSessionId(sessions[0].id);
        } else if (sessions.length === 0) {
          // If no sessions exist, create a default one
          try {
            console.log("currentAppId dskskkdjjksdkj", appId);
            //await createSession(appId, "Default Session");
          } catch (error) {
            console.error("Failed to create default session:", error);
          }
        }
        // Mark as initialized to prevent running again
        setInitializedSession(true);
      }
    };
    console.log("initializedSession", initializedSession);
    initializeSession();
  }, [
    appId,
    sessions,
    isLoading,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    initializedSession,
  ]);

  // Get current app name from the app context
  console.log("apps", apps);
  console.log("currentAppId", currentAppId);
  const currentApp = apps.find((app) => app.id === appId);
  const appName = currentApp?.app_name || "My App";

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{appName}</h1>
          {/* Pass sessions and needed functions to SessionSelector */}
          <SessionSelector
            sessions={sessions}
            currentSessionId={currentSessionId}
            setCurrentSessionId={setCurrentSessionId}
            createSession={(title) => createSession(appId, title)}
            isLoading={isLoading}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
