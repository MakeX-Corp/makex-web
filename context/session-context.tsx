"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useApp } from "@/context/AppContext"; // Import the AppContext hook
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
  appId: string | null;
  appName: string;
  appUrl: string;
  apiUrl: string;
  supabaseProject: any;
  setSupabaseProject: (project: any) => void;
  isAppReady: boolean;

  // Session lists
  sessions: SessionListItem[];
  loadingSessions: boolean;
  sessionsError: string | null;

  // Current session
  currentSession: SessionData | null;
  currentSessionId: string | null;
  loadingCurrentSession: boolean;
  currentSessionError: string | null;

  // Session name
  sessionName: string;
  setSessionName: (name: string) => void;

  // Actions
  loadSessions: (appId: string) => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  createSession: () => Promise<SessionData | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<boolean>;
  initializeApp: (newAppId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  initialAppId = null,
}: {
  children: ReactNode;
  initialAppId?: string | null;
}) {
  // Get app data from AppContext
  const { apps } = useApp(); // Access the parent AppContext

  // App data
  const [appId, setAppId] = useState<string | null>(initialAppId);
  const [appName, setAppName] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [appUrl, setAppUrl] = useState<string>("");
  const [supabaseProject, setSupabaseProject] = useState<any>(null);
  const [isAppReady, setIsAppReady] = useState<boolean>(false);

  // Session list state
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Current session state
  const [currentSession, setCurrentSession] = useState<SessionData | null>(
    null
  );
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingCurrentSession, setLoadingCurrentSession] =
    useState<boolean>(false);
  const [currentSessionError, setCurrentSessionError] = useState<string | null>(
    null
  );

  // Session name state
  const [sessionName, setSessionName] = useState<string>("");

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
          `Failed to fetch app configuration: ${error || "No data returned"}`
        );
      }

      // Set the configuration values from database
      setApiUrl(data.api_url || "");
      setAppUrl(data.app_url || "");

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
      setIsAppReady(false); // Make sure we set this to false if there's an error
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
        // Update the session name when switching sessions
        setSessionName(sessionData.title || "");
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
        // Update sessions list
        setSessions((prev) => [newSession, ...prev]);

        // Switch to the new session
        setCurrentSession(newSession);
        setCurrentSessionId(newSession.id);
        // Set the session name for the new session
        setSessionName(newSession.title || "");

        // Update URL
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("sessionId", newSession.id);
          window.history.pushState(
            { path: url.toString() },
            "",
            url.toString()
          );
        }

        return newSession;
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
          prev.filter((session) => session.id !== sessionId)
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
            setSessionName(""); // Reset session name
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
    title: string
  ): Promise<boolean> => {
    try {
      if (!appId || !title.trim()) return false;

      const result = await updateSessionTitleApi(sessionId, title.trim());

      if (result) {
        // Update the sessions list with the new title
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? { ...session, title: title.trim() }
              : session
          )
        );

        // If this is the current session, update it too
        if (sessionId === currentSessionId && currentSession) {
          setCurrentSession({
            ...currentSession,
            title: title.trim(),
          });
          // Update session name when title changes
          setSessionName(title.trim());
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

  // The context value
  const value = {
    appId,
    appName,
    appUrl,
    apiUrl,
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
    sessionName,
    setSessionName,
    loadSessions,
    switchSession,
    createSession,
    deleteSession,
    updateSessionTitle,
    initializeApp,
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
