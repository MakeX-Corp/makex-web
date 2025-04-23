"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getAuthToken,
  getUserEmailFromToken,
  getPlanName,
} from "@/utils/client/auth";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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

  // Subscription
  subscription: SubscriptionData | null;
  refreshSubscription: () => Promise<void>;

  createApp: (prompt: string) => Promise<string>; // Returns URL to redirect to
  deleteApp: (appId: string) => Promise<void>;

  // Authentication
  signOut: () => Promise<void>;
  isSigningOut: boolean;

  // Auth token
  authToken: string | null;

  // Loading states
  isLoading: boolean;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to extract app ID from path
const getAppIdFromPath = (pathname: string): string | null => {
  const pathSegments = pathname.split("/");
  const workspaceIndex = pathSegments.findIndex(
    (segment) => segment === "workspace"
  );

  if (workspaceIndex !== -1 && workspaceIndex + 1 < pathSegments.length) {
    return pathSegments[workspaceIndex + 1];
  }

  const appIndex = pathSegments.findIndex((segment) => segment === "app") + 1;
  if (appIndex > 0 && appIndex < pathSegments.length) {
    return pathSegments[appIndex];
  }

  return null;
};

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Sidebar state
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Sample apps data - will be replaced by API data on load
  const [apps, setApps] = useState<AppData[]>([]);

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

  // Store auth token in state
  const [authToken, setAuthToken] = useState<string | null>(() =>
    getAuthToken()
  );

  // Sign out function
  const signOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClientComponentClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out from Supabase:", error);
        throw error;
      }
      // Clear local app state
      setApps([]);
      setSubscription(null);
      // Redirect to home/login page
      router.push("/");
    } catch (error) {
      console.error("Error during sign out process:", error);
      // Even if there's an error, try to redirect
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
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
      fetchApps();
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
    } finally {
      setIsLoading(false);
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
    subscription,
    isLoading,
    isLoadingSessions,
    createApp,
    deleteApp,
    refreshApps: fetchApps,
    refreshSubscription: fetchSubscription,
    signOut,
    isSigningOut,
    authToken,
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
