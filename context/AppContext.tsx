"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  getAuthToken,
  getUserEmailFromToken,
  getPlanName,
} from "@/utils/client/auth";

// Define app data interface based on the API response
export interface AppData {
  id: string;
  user_id: string;
  app_name: string;
  app_url: string;
  machine_id: string;
  created_at: string;
  initial_commit: string;
  status: string | null;
}

// Define session data interface
export interface SessionData {
  id: string;
  app_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  metadata: any | null;
  visible: boolean | null;
}

// Define subscription data interface based on the API response
export interface SubscriptionData {
  subscription: {
    id: string;
    user_id: string;
    status: string;
    price_id: string;
    customer_id: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    created_at: string;
  } | null;
  hasActiveSubscription: boolean;
  pendingCancellation: boolean;
  expiresAt: string | null;
  planId: string | null;
  customerId: string | null;
  userId: string;
  email: string;
  planName: string;
}

// Define the context shape
interface AppContextType {
  // Sidebar
  sidebarVisible: boolean;
  toggleSidebar: () => void;

  // Apps
  apps: AppData[];
  setApps: React.Dispatch<React.SetStateAction<AppData[]>>;
  currentAppId: string | null;
  refreshApps: () => Promise<void>;

  // Sessions
  sessions: SessionData[];
  setSessions: React.Dispatch<React.SetStateAction<SessionData[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  fetchSessions: (appId: string) => Promise<SessionData[]>;
  createSession: (
    appId: string,
    title?: string,
    metadata?: any
  ) => Promise<SessionData>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Subscription
  subscription: SubscriptionData | null;
  refreshSubscription: () => Promise<void>;

  createApp: (prompt: string) => Promise<string>; // Returns URL to redirect to
  deleteApp: (appId: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to extract app ID from path
const getAppIdFromPath = (pathname: string): string | null => {
  const pathSegments = pathname.split("/");
  const appIndex = pathSegments.findIndex((segment) => segment === "app") + 1;

  if (appIndex > 0 && appIndex < pathSegments.length) {
    return pathSegments[appIndex];
  }
  return null;
};

// Mutex flags to prevent concurrent operations
let isFetchingSessionsForApp: string | null = null;
let isCreatingSession = false;

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();

  // Sidebar state
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Sample apps data - will be replaced by API data on load
  const [apps, setApps] = useState<AppData[]>([]);

  // Sessions state
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Initialize subscription state
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );

  // Determine current app ID from path using the helper function
  const currentAppId = getAppIdFromPath(pathname);

  // Toggle function for sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Create app function
  const createApp = async (prompt: string): Promise<string> => {
    const decodedToken = getAuthToken();

    if (!decodedToken) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch("/api/app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decodedToken}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to create app");
      }

      const data = await response.json();
      return data.redirectUrl;
    } catch (error) {
      console.error("Error creating app:", error);
      throw error;
    }
  };

  // Delete app function
  const deleteApp = async (appId: string) => {
    const decodedToken = getAuthToken();
    if (!decodedToken) {
      throw new Error("No authentication token found");
    }
    try {
      const response = await fetch(`/api/app?id=${appId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${decodedToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete app");
      }
      setApps((prev) => prev.filter((app) => app.id !== appId));
    } catch (error) {
      console.error("Error deleting app:", error);
      throw error;
    }
  };

  // Fetch apps from API with authentication
  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const decodedToken = getAuthToken();

      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      // Fetch user apps
      const appsResponse = await fetch("/api/app", {
        headers: {
          Authorization: `Bearer ${decodedToken}`,
        },
      });

      if (!appsResponse.ok) {
        const error = await appsResponse.json();
        throw new Error(error.error || "Failed to fetch apps");
      }

      const data = await appsResponse.json();
      setApps(data);
    } catch (error) {
      console.error("Error fetching apps:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching apps",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch sessions for a specific app with mutex protection
  const fetchSessions = async (appId: string): Promise<SessionData[]> => {
    // If we're already fetching sessions for this app, don't start another fetch
    if (isFetchingSessionsForApp === appId) {
      console.log(`Already fetching sessions for app ${appId}, waiting...`);

      // Wait for the current fetch to complete
      let attempts = 0;
      while (isFetchingSessionsForApp === appId && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      // If we already have sessions for this app, return them
      const appSessions = sessions.filter(
        (session) => session.app_id === appId
      );
      if (appSessions.length > 0) {
        console.log(`Sessions for app ${appId} were loaded by another request`);
        return appSessions;
      }
    }

    try {
      isFetchingSessionsForApp = appId;
      console.log(`Fetching sessions for app ${appId}`);

      const decodedToken = getAuthToken();
      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/sessions?appId=${appId}`, {
        headers: {
          Authorization: `Bearer ${decodedToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch sessions");
      }

      const data = await response.json();
      console.log(`Received ${data.length} sessions for app ${appId}`);

      // Keep any existing sessions for other apps, replace just this app's sessions
      setSessions((prev) => {
        const otherAppSessions = prev.filter(
          (session) => session.app_id !== appId
        );
        return [...otherAppSessions, ...data];
      });

      return data;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching sessions",
      });
      return [];
    } finally {
      // Clear the mutex
      isFetchingSessionsForApp = null;
    }
  };

  // Function to create a new session with mutex protection
  const createSession = async (
    appId: string,
    title?: string,
    metadata?: any
  ): Promise<SessionData> => {
    // Check for existing session with the same title
    if (title) {
      const existingSession = sessions.find(
        (session) => session.app_id === appId && session.title === title
      );
      if (existingSession) {
        console.log(
          `Session with title "${title}" already exists, using existing session`
        );
        setCurrentSessionId(existingSession.id);
        return existingSession;
      }
    }

    // Use a mutex to prevent multiple simultaneous creations
    if (isCreatingSession) {
      console.log("Session creation already in progress, waiting...");
      let attempts = 0;
      while (isCreatingSession && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      // After waiting, check again for a session with the same title
      if (title) {
        const existingSession = sessions.find(
          (session) => session.app_id === appId && session.title === title
        );
        if (existingSession) {
          console.log(
            `Session with title "${title}" was created while waiting, using existing session`
          );
          setCurrentSessionId(existingSession.id);
          return existingSession;
        }
      }
    }

    try {
      isCreatingSession = true;
      console.log(
        `Creating new session for app ${appId} with title "${
          title || "Untitled"
        }"`
      );

      const decodedToken = getAuthToken();
      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decodedToken}`,
        },
        body: JSON.stringify({
          appId,
          title: title || null,
          metadata: metadata || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create session");
      }

      const newSession = await response.json();
      console.log(`Session created successfully: ${newSession.id}`);

      // Add new session to state, avoiding duplicates
      setSessions((prev) => {
        if (prev.some((session) => session.id === newSession.id)) {
          return prev;
        }
        return [...prev, newSession];
      });

      // Set as current session
      setCurrentSessionId(newSession.id);

      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating a session",
      });
      throw error;
    } finally {
      isCreatingSession = false;
    }
  };

  // Function to delete (soft-delete) a session
  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      const decodedToken = getAuthToken();

      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${decodedToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete session");
      }

      // Update sessions state to remove the deleted session
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      // If the deleted session was the current one, clear the current session
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the session",
      });
    }
  };

  // Function to fetch subscription data
  const fetchSubscription = async () => {
    try {
      const decodedToken = getAuthToken();

      if (!decodedToken) {
        throw new Error("No authentication token found");
      }

      // Fetch subscription data
      const subscriptionResponse = await fetch("/api/subscription", {
        headers: {
          Authorization: `Bearer ${decodedToken}`,
        },
      });

      if (!subscriptionResponse.ok) {
        const error = await subscriptionResponse.json();
        throw new Error(error.error || "Failed to fetch subscription data");
      }

      const data = await subscriptionResponse.json();

      // Get email from token using the provided utility function
      const email = getUserEmailFromToken(decodedToken) || "";
      const planName = getPlanName(data.subscription?.planId || "");
      data.email = email;
      data.planName = planName;

      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching subscription data",
      });
    }
  };

  // Fetch data on initial load - only get apps and subscription
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        // Only fetch apps and subscription data on initial load
        // DO NOT fetch sessions here - let the workspace component handle that
        await Promise.all([fetchApps(), fetchSubscription()]);
      } catch (error) {
        console.error("Error during initial data fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
    // No dependencies - only run once on mount
  }, []);

  // Context value
  const value = {
    sidebarVisible,
    toggleSidebar,
    apps,
    setApps,
    currentAppId,
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    fetchSessions,
    createSession,
    deleteSession,
    subscription,
    isLoading,
    createApp,
    deleteApp,
    refreshApps: fetchApps,
    refreshSubscription: fetchSubscription,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use the dashboard context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within a AppProvider");
  }
  return context;
}

// Custom hook to get app ID from path
export function useAppId() {
  const pathname = usePathname();
  return getAppIdFromPath(pathname);
}
