"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useApp } from "@/context/app-context";
import {
  getSessionsForApp,
  createNewSession,
  getSession,
  getAppInfo,
  deleteSession as deleteSessionApi,
  updateSessionTitle as updateSessionTitleApi,
  SessionListItem,
  SessionData,
} from "@/lib/session-service";

interface SessionContextType {
  // App data
  appId: string;
  appName: string;
  appUrl: string;
  supabaseProject: any;
  setSupabaseProject: (project: any) => void;
  isAppReady: boolean;
  github_sync_repo: string | null;

  // Session lists
  sessions: SessionListItem[];
  loadingSessions: boolean;
  sessionsError: string | null;

  // Current session
  currentSession: SessionData | null;
  currentSessionId: string | null;
  loadingCurrentSession: boolean;
  currentSessionError: string | null;
  justCreatedSessionId: string | null;

  // Convex
  convexConfig: {
    devUrl: string | null;
    projectId: string | null;
    devAdminKey: string | null;
    prodUrl: string | null;
    prodAdminKey: string | null;
  };

  // Actions
  loadSessions: (appId: string) => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  createSession: () => Promise<SessionData | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<boolean>;
  initializeApp: (newAppId: string) => Promise<void>;
  refreshApp: () => Promise<void>;

  // Get current session title helper
  getCurrentSessionTitle: () => string;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  initialAppId,
}: {
  children: ReactNode;
  initialAppId: string;
}) {
  // Get app data from AppContext
  const { apps } = useApp();

  // App data
  const [appId, setAppId] = useState<string>(initialAppId);
  const [appName, setAppName] = useState<string>("");
  const [appUrl, setAppUrl] = useState<string>("");
  const [supabaseProject, setSupabaseProject] = useState<any>(null);
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [github_sync_repo, setGithubSyncRepo] = useState<string | null>(null);

  // Session list state
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Current session state
  const [currentSession, setCurrentSession] = useState<SessionData | null>(
    null,
  );
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingCurrentSession, setLoadingCurrentSession] =
    useState<boolean>(false);
  const [currentSessionError, setCurrentSessionError] = useState<string | null>(
    null,
  );
  const [justCreatedSessionId, setJustCreatedSessionId] = useState<
    string | null
  >(null);

  // Convex config state
  const [convexConfig, setConvexConfig] = useState<{
    devUrl: string | null;
    projectId: string | null;
    devAdminKey: string | null;
    prodUrl: string | null;
    prodAdminKey: string | null;
  }>({
    devUrl: null,
    projectId: null,
    devAdminKey: null,
    prodUrl: null,
    prodAdminKey: null,
  });

  // Helper function to get current session title - single source of truth
  const getCurrentSessionTitle = () => {
    if (!currentSessionId || sessions.length === 0) return "New Chat";

    const session = sessions.find((s) => s.id === currentSessionId);
    return session?.title || "New Chat";
  };

  // Effect to sync app name with AppContext
  useEffect(() => {
    if (appId && apps.length > 0) {
      // Find the current app in the AppContext apps array
      const currentApp = apps.find((app) => app.id === appId);

      if (
        currentApp &&
        (currentApp.display_name !== appName || currentApp.app_name !== appName)
      ) {
        // Update local appName state when it changes in AppContext
        setAppName(currentApp.display_name || currentApp.app_name || "");
      }
    }
  }, [appId, apps, appName]);

  // Initialize the app with an appId and fetch its configuration
  const initializeApp = async (newAppId: string) => {
    try {
      setAppId(newAppId);
      setIsAppReady(false);

      // First check if the app exists in AppContext
      const currentApp = apps.find((app) => app.id === newAppId);

      if (currentApp) {
        // Use data from AppContext if available
        setAppName(currentApp.display_name || currentApp.app_name || "");
      }

      // Use our new getAppInfo function to fetch app details
      const { data, error } = await getAppInfo(newAppId);

      if (error || !data) {
        throw new Error(
          `Failed to fetch app configuration: ${error || "No data returned"}`,
        );
      }

      // Set the configuration values from database
      setAppUrl(data.app_url || "");
      setGithubSyncRepo(data.github_sync_repo || null);

      setConvexConfig({
        devUrl: data.convex_dev_url || null,
        projectId: data.convex_project_id || null,
        devAdminKey: data.convex_dev_admin_key || null,
        prodUrl: data.convex_prod_url || null,
        prodAdminKey: data.convex_prod_admin_key || null,
      });

      // Only set appName if it's not already set from AppContext
      if (!currentApp) {
        setAppName(data.display_name || data.app_name || "");
      }

      setSupabaseProject(data.supabase_project);

      // Now load the sessions for this app
      await loadSessions(newAppId);
      setIsAppReady(true);
    } catch (error) {
      console.error("Failed to initialize app:", error);
      setSessionsError("Failed to initialize app");
      setIsAppReady(false);
    }
  };

  // Load sessions for an app
  const loadSessions = async (newAppId: string) => {
    try {
      // If appId is the same, don't reload unless forced
      if (appId === newAppId && sessions.length > 0) {
        return;
      }
      setLoadingSessions(true);
      setSessionsError(null);

      const { sessions: sessionsList } = await getSessionsForApp(newAppId);
      setSessions(sessionsList);

      // Check URL for sessionId first
      const urlSessionId =
        typeof window !== "undefined"
          ? new URL(window.location.href).searchParams.get("sessionId")
          : null;

      if (
        urlSessionId &&
        sessionsList.some((session) => session.id === urlSessionId)
      ) {
        // Use session ID from URL if it's valid
        await switchSession(urlSessionId);
      } else {
        await createSession();
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      setSessionsError("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  // Switch to a different session
  const switchSession = async (sessionId: string) => {
    try {
      if (!appId) return;

      setLoadingCurrentSession(true);
      setCurrentSessionError(null);

      setJustCreatedSessionId(null);

      // Update the URL without causing a page reload
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("sessionId", sessionId);
        window.history.pushState({ path: url.toString() }, "", url.toString());
      }

      // Load the session data
      const sessionData = await getSession(appId, sessionId);

      if (sessionData) {
        setCurrentSession(sessionData);
        setCurrentSessionId(sessionId);

        // Update the sessions array if we have a new title from the API
        if (sessionData.title) {
          setSessions((prevSessions) => {
            return prevSessions.map((session) =>
              session.id === sessionId
                ? { ...session, title: sessionData.title || "New Chat" }
                : session,
            );
          });
        }
      } else {
        setCurrentSessionError(`Session ${sessionId} not found`);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      setCurrentSessionError("Failed to load session data");
    } finally {
      setLoadingCurrentSession(false);
    }
  };

  // Create a new session
  const createSession = async () => {
    try {
      if (!appId) return null;

      setLoadingCurrentSession(true);
      setCurrentSessionError(null);

      const newSession = await createNewSession(appId);

      if (newSession) {
        // Force a clean title if one isn't provided
        const sessionWithTitle = {
          ...newSession,
          title: newSession.title || "New Chat",
        };

        setJustCreatedSessionId(sessionWithTitle.id);

        // Update sessions list with this new session
        setSessions((prev) => [sessionWithTitle, ...prev]);

        // Set as current session
        setCurrentSession(sessionWithTitle);
        setCurrentSessionId(sessionWithTitle.id);

        // Update URL
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("sessionId", sessionWithTitle.id);
          window.history.pushState(
            { path: url.toString() },
            "",
            url.toString(),
          );
        }

        return sessionWithTitle;
      } else {
        setCurrentSessionError("Failed to create new session");
        return null;
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      setCurrentSessionError("Error creating new session");
      return null;
    } finally {
      setLoadingCurrentSession(false);
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string): Promise<boolean> => {
    try {
      if (!appId) return false;

      const result = await deleteSessionApi(sessionId);

      if (result) {
        // Update the sessions list by removing the deleted session
        setSessions((prev) =>
          prev.filter((session) => session.id !== sessionId),
        );

        // If we're deleting the current session, switch to another one
        if (sessionId === currentSessionId) {
          const remainingSessions = sessions.filter((s) => s.id !== sessionId);
          if (remainingSessions.length > 0) {
            await switchSession(remainingSessions[0].id);
          } else {
            // If no sessions left, clear current session
            setCurrentSession(null);
            setCurrentSessionId(null);
          }
        }

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      return false;
    }
  };

  // Update session title
  const updateSessionTitle = async (
    sessionId: string,
    title: string,
  ): Promise<boolean> => {
    try {
      if (!appId || !title.trim()) return false;

      // Call the API to update the title
      const result = await updateSessionTitleApi(sessionId, title.trim());

      if (result) {
        // Update the sessions list with the new title
        setSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === sessionId
              ? { ...session, title: title.trim() }
              : session,
          ),
        );

        // Also update the current session object if this is the current session
        if (sessionId === currentSessionId && currentSession) {
          setCurrentSession({
            ...currentSession,
            title: title.trim(),
          });
        }

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Failed to update session title:", error);
      return false;
    }
  };

  // Refresh app data
  const refreshApp = async () => {
    if (!appId) return;

    try {
      // Re-fetch app info to get updated data
      const { data, error } = await getAppInfo(appId);

      if (error || !data) {
        console.error("Failed to refresh app data:", error);
        return;
      }

      // Update app data
      setAppUrl(data.app_url || "");
      setGithubSyncRepo(data.github_sync_repo || null);

      setConvexConfig({
        devUrl: data.convex_dev_url || null,
        projectId: data.convex_project_id || null,
        devAdminKey: data.convex_dev_admin_key || null,
        prodUrl: data.convex_prod_url || null,
        prodAdminKey: data.convex_prod_admin_key || null,
      });

      setSupabaseProject(data.supabase_project);
    } catch (error) {
      console.error("Failed to refresh app:", error);
    }
  };

  // The context value
  const value = {
    appId,
    appName,
    appUrl,
    convexConfig,
    supabaseProject,
    setSupabaseProject,
    isAppReady,
    sessions,
    loadingSessions,
    sessionsError,
    currentSession,
    currentSessionId,
    loadingCurrentSession,
    currentSessionError,
    justCreatedSessionId,
    loadSessions,
    switchSession,
    createSession,
    deleteSession,
    updateSessionTitle,
    initializeApp,
    getCurrentSessionTitle,
    github_sync_repo,
    refreshApp,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

// Hook to use the session context
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
