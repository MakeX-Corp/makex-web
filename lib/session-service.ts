// lib/session-service.ts
import { getAuthToken } from "@/utils/client/auth";
// Type definitions
export interface SessionListItem {
  id: string;
  title: string;
  app_id: string;
  created_at: string;
  last_activity?: string;
}

export interface SessionData {
  id: string;
  title: string;
  app_id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  metadata?: any;
}

// API response types
interface ApiError {
  error: string;
}

// Helper function to check if response is an ApiError
function isApiError(data: any): data is ApiError {
  return data && typeof data.error === "string";
}

// Get session list for an app
export async function getSessionsForApp(
  appId: string
): Promise<{ sessions: SessionListItem[] }> {
  try {
    const decodedToken = getAuthToken();

    if (!decodedToken) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `/api/sessions?appId=${encodeURIComponent(appId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decodedToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        isApiError(data) ? data.error : "Failed to fetch sessions"
      );
    }

    // Map to our SessionListItem format
    const sessions = data.map((session: any) => ({
      id: session.id,
      title: session.title || `New Chat`, // Use title or fallback
      app_id: session.app_id,
      created_at: session.created_at,
      last_activity: session.updated_at,
    }));

    return { sessions };
  } catch (error) {
    console.error("[SESSION SERVICE] Error fetching sessions:", error);
    // You might want to show a toast notification here
    return { sessions: [] };
  }
}

// Get a specific session
export async function getSession(
  appId: string,
  sessionId: string
): Promise<SessionData | null> {
  try {
    const decodedToken = getAuthToken();

    if (!decodedToken) {
      throw new Error("No authentication token found");
    }
    // First check if this is a new session request
    if (sessionId.startsWith("new-session-")) {
      // Create a new session
      return createNewSession(
        appId,
        `New Session ${new Date().toLocaleString()}`
      );
    }

    // Fetch the session from the API
    const response = await fetch(`/api/sessions?sessionId=${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${decodedToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        isApiError(data) ? data.error : "Failed to fetch session"
      );
    }

    // Process the session data
    const sessionData: SessionData = {
      id: data.id,
      title: data.title || `Session ${data.id.slice(0, 8)}`,
      app_id: data.app_id,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      metadata: data.metadata || {},
    };

    return sessionData;
  } catch (error) {
    console.error("[SESSION SERVICE] Error fetching session:", error);
    return null;
  }
}

// Create a new session
export async function createNewSession(
  appId: string,
  title?: string
): Promise<SessionData | null> {
  try {
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
        title: title || `New Chat`,
        metadata: {
          createdFrom: "workspace",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        isApiError(data) ? data.error : "Failed to create session"
      );
    }

    return {
      id: data.id,
      title: data.title,
      app_id: data.app_id,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      metadata: data.metadata || {},
    };
  } catch (error) {
    console.error("[SESSION SERVICE] Error creating session:", error);
    return null;
  }
}

// Delete a session (soft delete)
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const decodedToken = getAuthToken();

    if (!decodedToken) {
      throw new Error("No authentication token found");
    }
    const response = await fetch(
      `/api/sessions?sessionId=${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decodedToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        isApiError(data) ? data.error : "Failed to delete session"
      );
    }

    return true;
  } catch (error) {
    console.error("[SESSION SERVICE] Error deleting session:", error);
    return false;
  }
}

// Add this function to lib/session-service.ts

// Update session title
export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<boolean> {
  try {
    const decodedToken = getAuthToken();

    if (!decodedToken) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`/api/sessions/title`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${decodedToken}`,
      },
      body: JSON.stringify({
        sessionId,
        title,
        isAiGenerated: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        isApiError(data) ? data.error : "Failed to update session title"
      );
    }

    return true;
  } catch (error) {
    console.error("[SESSION SERVICE] Error updating session title:", error);
    return false;
  }
}

// Get app information
export async function getAppInfo(appId: string): Promise<{
  data: any | null;
  error: string | null;
}> {
  try {
    const decodedToken = getAuthToken();

    if (!decodedToken) {
      return { data: null, error: "No authentication token found" };
    }

    const response = await fetch(`/api/app?id=${encodeURIComponent(appId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${decodedToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: isApiError(data)
          ? data.error
          : `Failed to fetch app info: ${response.status}`,
      };
    }

    return {
      data: {
        id: data.id,
        app_name: data.app_name,
        display_name: data.display_name,
        api_url: data.api_url,
        app_url: data.app_url,
        supabase_project: data.supabase_project,
      },
      error: null,
    };
  } catch (error) {
    console.error("[SESSION SERVICE] Error fetching app info:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error fetching app info",
    };
  }
}
