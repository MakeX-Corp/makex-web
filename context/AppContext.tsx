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
  // Loading states
  isLoading: boolean;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

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

  // Initialize subscription state
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );

  // Determine current app ID from path
  const pathSegments = pathname.split("/");
  const appIdIndex = pathSegments.findIndex((segment) => segment === "app") + 1;
  const currentAppId =
    appIdIndex > 0 && appIdIndex < pathSegments.length
      ? pathSegments[appIdIndex]
      : null;

  // Toggle function for sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
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
      // Refresh apps list after successful creation
      // await fetchApps();
      return data.redirectUrl;
    } catch (error) {
      console.error("Error creating app:", error);
      throw error;
    }
  };
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

  // Function to fetch subscription data
  const fetchSubscription = async () => {
    setIsLoading(true);
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
      console.log("this is the data", data);
      // Get email from token using the provided utility function
      const email = getUserEmailFromToken(decodedToken) || "";
      const planName = getPlanName(data.subscription?.planId || "");
      data.email = email;
      data.planName = planName;

      console.log("this is the data ===d", data);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([fetchApps(), fetchSubscription()]);
      } catch (error) {
        console.error("Error during initial data fetch:", error);
      }
    };

    fetchInitialData();
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
    createApp,
    deleteApp,
    refreshApps: fetchApps, // Expose the fetch function for manual refresh
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
