"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import posthog from "posthog-js";
// Define app data interface based on the API response
export interface AppData {
  id: string;
  user_id: string;
  app_name: string;
  display_name: string;
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
  hasActiveSubscription: boolean;
  messagesLimit: number;
  planName: string;
  messagesUsed: number;
  nextBillingDate: string | null;
  subscriptionType: string;
  canSendMessage: boolean;
  userId: string;
  customerId: string | null;
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

  // Loading states
  isLoading: boolean;

  isAIResponding: boolean;
  setIsAIResponding: (isAIResponding: boolean) => void;

  user: User | null;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to extract app ID from path
const getAppIdFromPath = (pathname: string): string | null => {
  const pathSegments = pathname.split("/");
  const workspaceIndex = pathSegments.findIndex(
    (segment) => segment === "workspace",
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

  // Sample apps data - will be replaced by API data on load
  const [apps, setApps] = useState<AppData[]>([]);

  // Initialize subscription state
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );

  const [isAIResponding, setIsAIResponding] = useState(false);

  // Determine current app ID from path using the helper function
  const currentAppId = getAppIdFromPath(pathname);

  // const email
  const [user, setUser] = useState<User | null>(null);

  // Toggle function for sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Create app function
  const createApp = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch("/api/app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    try {
      const response = await fetch(`/api/app?id=${appId}`, {
        method: "DELETE",
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
    try {
      // Fetch user apps
      const appsResponse = await fetch("/api/app", {});

      if (!appsResponse.ok) {
        const error = await appsResponse.json();
        throw new Error(error.error || "Failed to fetch apps");
      }

      const data = await appsResponse.json();
      setApps(data);
    } catch (error) {
      console.error("Error fetching apps:", error);
    }
  };

  // Function to fetch subscription data
  const fetchSubscription = async () => {
    try {
      // Fetch subscription data
      const subscriptionResponse = await fetch("/api/subscription");

      if (!subscriptionResponse.ok) {
        const error = await subscriptionResponse.json();
        throw new Error(error.error || "Failed to fetch subscription data");
      }

      const data = await subscriptionResponse.json();

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

        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        setUser(data.user || null);
        posthog.identify(data.user?.email || "", {
          email: data.user?.email || "",
          supabase_id: data.user?.id,
        });
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
    isAIResponding,
    setIsAIResponding,
    user,
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
