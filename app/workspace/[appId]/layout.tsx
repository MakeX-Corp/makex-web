"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { SessionSelector } from "@/components/workspace/session-selector";
import { useApp } from "@/context/AppContext";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    isLoading,
    apps,
    currentAppId,
    fetchSessions,
  } = useApp();

  const router = useRouter();
  const unwrappedParams = use(params);
  const appId = (unwrappedParams as { appId: string }).appId;
  const sessionId = (unwrappedParams as { sessionId?: string }).sessionId;

  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingState, setLoadingState] = useState<
    | "idle"
    | "loading-sessions"
    | "setting-session"
    | "creating-session"
    | "complete"
  >("idle");

  // Atomic session initialization - handles the entire process in one go
  const initializeWorkspace = useCallback(async () => {
    if (!appId || loadingState !== "idle") return;

    try {
      console.log("Starting workspace initialization");
      setLoadingState("loading-sessions");

      // Step 1: Make sure we have sessions data
      let sessionsData = sessions;
      if (sessions.length === 0) {
        console.log("Fetching sessions for app:", appId);
        sessionsData = await fetchSessions(appId);
      }

      // Step 2: Determine which session to use
      // Case A: Use session from URL if valid
      if (sessionId && sessionsData.some((s) => s.id === sessionId)) {
        console.log("Using session from URL:", sessionId);
        setLoadingState("setting-session");
        setCurrentSessionId(sessionId);
        setLoadingState("complete");
        return;
      }

      // Case B: We already have a valid current session
      if (
        currentSessionId &&
        sessionsData.some((s) => s.id === currentSessionId)
      ) {
        console.log("Using current session:", currentSessionId);
        setLoadingState("setting-session");

        // Update URL if needed (without creating a new history entry)
        if (sessionId !== currentSessionId) {
          router.replace(`/workspace/${appId}/${currentSessionId}`);
        }

        setLoadingState("complete");
        return;
      }

      // Case C: We have sessions but no current one, use the first
      if (sessionsData.length > 0) {
        console.log("Using first available session:", sessionsData[0].id);
        setLoadingState("setting-session");
        setCurrentSessionId(sessionsData[0].id);
        router.replace(`/workspace/${appId}/${sessionsData[0].id}`);
        setLoadingState("complete");
        return;
      }

      // Case D: No sessions exist, create default
      console.log("No sessions found, creating default session");
      setLoadingState("creating-session");
      const newSession = await createSession(appId, "Default Session");
      setCurrentSessionId(newSession.id);

      // Important: Navigate to the new session route
      router.replace(`/workspace/${appId}/${newSession.id}`);
      setLoadingState("complete");
    } catch (error) {
      console.error("Workspace initialization failed:", error);
      // Even on error, mark as complete to allow retrying
      setLoadingState("complete");
    } finally {
      setIsInitializing(false);
    }
  }, [
    appId,
    sessionId,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    fetchSessions,
    createSession,
    router,
  ]);

  // Run the atomic initialization once when component mounts or key dependencies change
  useEffect(() => {
    if (!isLoading && loadingState === "idle") {
      initializeWorkspace();
    }
  }, [initializeWorkspace, isLoading, loadingState]);

  // Get current app name
  const currentApp = apps.find((app) => app.id === appId);
  const appName = currentApp?.app_name || "My App";

  // Helper function to create a session specific to this app
  const handleCreateSession = async (title: string) => {
    return await createSession(appId, title);
  };

  // Handle session selection from dropdown
  const handleSessionChange = useCallback(
    (newSessionId: string) => {
      if (newSessionId === currentSessionId) return;

      setCurrentSessionId(newSessionId);
      router.push(`/workspace/${appId}/${newSessionId}`);
    },
    [appId, currentSessionId, setCurrentSessionId, router]
  );

  // Determine if we're in a loading state
  const showLoading = isLoading || loadingState !== "complete";

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4 bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{appName}</h1>
          <SessionSelector
            sessions={sessions}
            currentSessionId={currentSessionId}
            setCurrentSessionId={handleSessionChange}
            createSession={handleCreateSession}
            isLoading={showLoading}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {showLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="h-4 w-4 bg-primary rounded-full animate-ping inline-block"></div>
              <p className="mt-4 text-muted-foreground">
                {loadingState === "loading-sessions" && "Loading sessions..."}
                {loadingState === "setting-session" &&
                  "Setting up workspace..."}
                {loadingState === "creating-session" &&
                  "Creating new session..."}
                {loadingState === "idle" && "Initializing..."}
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
