"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getSessionsForApp,
  createNewSession,
  getSession,
  deleteSession as deleteSessionApi,
  updateSessionTitle as updateSessionTitleApi,
  SessionListItem,
  SessionData,
} from "@/lib/session-service";
import { toast } from "sonner";

interface SessionContextType {
  // App data
  appId: string | null;
  appName: string;

  // Session lists
  sessions: SessionListItem[];
  loadingSessions: boolean;
  sessionsError: string | null;

  // Current session
  currentSession: SessionData | null;
  currentSessionId: string | null;
  loadingCurrentSession: boolean;
  currentSessionError: string | null;

  // Actions
  loadSessions: (appId: string) => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  createSession: () => Promise<SessionData | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  initialAppId = null,
}: {
  children: ReactNode;
  initialAppId?: string | null;
}) {
  // App data
  const [appId, setAppId] = useState<string | null>(initialAppId);
  const [appName, setAppName] = useState<string>("");

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

  // Load sessions for an app
  const loadSessions = async (newAppId: string) => {
    try {
      // If appId is the same, don't reload unless forced
      if (appId === newAppId && sessions.length > 0) {
        console.log(
          `Sessions already loaded for app ${newAppId}, skipping reload`
        );
        return;
      }

      console.log(`Loading sessions for app ${newAppId} from service`);
      setAppId(newAppId);
      setLoadingSessions(true);
      setSessionsError(null);

      const { sessions: sessionsList, appName: fetchedAppName } =
        await getSessionsForApp(newAppId);

      console.log(
        `Received ${sessionsList.length} sessions for app ${newAppId}:`,
        sessionsList
      );
      setSessions(sessionsList);
      setAppName(fetchedAppName || `App ${newAppId}`);

      // Only select first session if we don't have a current session
      if (sessionsList.length > 0 && !currentSessionId) {
        console.log(`Auto-selecting first session: ${sessionsList[0].id}`);
        await switchSession(sessionsList[0].id);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      setSessionsError("Failed to load sessions");
      toast.error("Failed to load sessions");
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
      } else {
        setCurrentSessionError(`Session ${sessionId} not found`);
        toast.error(`Session ${sessionId} not found`);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      setCurrentSessionError("Failed to load session data");
      toast.error("Failed to load session data");
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
        toast.error("Failed to create new session");
        return null;
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      setCurrentSessionError("Error creating new session");
      toast.error("Error creating new session");
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
            // If no sessions left, create a new one
            setCurrentSession(null);
            setCurrentSessionId(null);
          }
        }

        toast.success("Session deleted successfully");
        return true;
      } else {
        toast.error("Failed to delete session");
        return false;
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("Error deleting session");
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
        }

        toast.success("Session title updated");
        return true;
      } else {
        toast.error("Failed to update session title");
        return false;
      }
    } catch (error) {
      console.error("Failed to update session title:", error);
      toast.error("Error updating session title");
      return false;
    }
  };

  // The context value
  const value = {
    appId,
    appName,
    sessions,
    loadingSessions,
    sessionsError,
    currentSession,
    currentSessionId,
    loadingCurrentSession,
    currentSessionError,
    loadSessions,
    switchSession,
    createSession,
    deleteSession,
    updateSessionTitle,
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
