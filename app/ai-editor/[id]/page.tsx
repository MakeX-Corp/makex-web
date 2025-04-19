"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import MobileMockup from "@/components/mobile-mockup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  ExternalLink,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Chat } from "@/components/chat";
import { QRCodeDisplay } from "@/components/qr-code";
import { SessionsSidebar } from "@/components/session/session-sidebar";
import { getAuthToken } from "@/utils/client/auth";
import { AppEditorSkeleton } from "@/app/components/AppEditorSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DiscordSupportButton } from "@/components/support-button";
import { SupabaseConnect } from "@/components/supabase-connect";
import { MobileView } from "@/components/mobile-view";

interface AppDetails {
  id: string;
  user_id: string;
  app_name: string;
  app_url: string | null;
  api_url: string | null;
  machine_id: string | null;
  created_at: string;
  updated_at: string;
  sandbox_id: string | null;
  sandbox_status: string | null;
  supabase_project: any;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
}

export default function AppEditor() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const appId = params.id as string;
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    searchParams.get("session")
  );
  const [app, setApp] = useState<AppDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<"mobile" | "qr">("mobile");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [supabaseProject, setSupabaseProject] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRecreatingSandbox, setIsRecreatingSandbox] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    setAuthToken(getAuthToken());
    const checkIsMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleResetApp = async () => {
    try {
      setIsResetting(true);
      const response = await fetch("/api/code/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
        },
        body: JSON.stringify({
          appId,
        }),
      });

      if (!response.ok) throw new Error("Failed to reset state");

      // Call onResponseComplete instead of reloading
      handleRefresh();
    } catch (error) {
      console.error("Error resetting state:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const fetchSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const response = await fetch(`/api/sessions?appId=${appId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchSessions();
    }
  }, [appId, authToken]);

  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("user_apps")
          .select("*")
          .eq("id", appId)
          .single();

        setSupabaseProject(data?.supabase_project);

        if (error) throw error;

        // Removed automatic sandbox recreation
        // Just set app data
        setApp(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching app details:", error);
        setIsLoading(false);
      }
    };

    fetchAppDetails();
  }, [appId, authToken]);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  // Enhanced session creation with retry mechanism
  const handleCreateSession = async () => {
    if (isCreatingSession) return;

    setIsCreatingSession(true);
    setSessionError(null);

    try {
      // 1. Create the session
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ appId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const newSession = await response.json();

      if (newSession && newSession.id) {
        // 2. Verify the session exists with a validation check
        let sessionConfirmed = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!sessionConfirmed && retryCount < maxRetries) {
          // Wait with exponential backoff (300ms, 600ms, 1200ms)
          await new Promise((r) =>
            setTimeout(r, 300 * Math.pow(2, retryCount))
          );

          try {
            // Instead of a separate verification endpoint that doesn't exist,
            // we'll use the existing /api/chat endpoint to check if the session exists
            const verifyResponse = await fetch(
              `/api/chat?sessionId=${newSession.id}&appId=${appId}`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );

            if (verifyResponse.ok) {
              sessionConfirmed = true;
            }
          } catch (error) {
            console.warn(
              `Session verification attempt ${retryCount + 1} failed`
            );
          }

          retryCount++;
        }

        // 3. Update state and UI
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);

        // 4. Update URL with new session ID
        router.push(`/ai-editor/${appId}?session=${newSession.id}`);
      } else {
        throw new Error("Invalid session data received");
      }
    } catch (error) {
      console.error("Error creating new session:", error);
      setSessionError("Failed to create session. Please try again.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSessionError = (error: string) => {
    setSessionError(error);
  };

  const handleRecreateSandbox = async () => {
    if (!app) return;

    try {
      setIsRecreatingSandbox(true);
      const response = await fetch("/api/sandbox/recreate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          appId: app.id,
          appName: app.app_name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to recreate sandbox");
      }

      const sandboxData = await response.json();
      console.log(sandboxData);

      // Refresh app data after recreation
      const { data } = await supabase
        .from("user_apps")
        .select("*")
        .eq("id", appId)
        .single();

      if (data) {
        setApp(data);
      }
    } catch (error) {
      console.error("Error recreating sandbox:", error);
    } finally {
      setIsRecreatingSandbox(false);
    }
  };

  if (isLoading) {
    return <AppEditorSkeleton />;
  }

  if (isMobileView) {
    return <MobileView />;
  }

  if (!app) {
    return (
      <div className="container mx-auto p-8 text-foreground">App not found</div>
    );
  }

  const exportCode = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/app/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          apiUrl: app.api_url,
          appId,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a download link
      const a = document.createElement("a");
      a.href = url;
      a.download = "app_export.zip";
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting app:", error);
      alert("Failed to export app. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Sessions Sidebar */}
      <div className="w-64 h-screen border-r border-border bg-background">
        <SessionsSidebar
          appId={appId}
          authToken={authToken || ""}
          sessions={sessions}
          setSessions={setSessions}
          loading={isSessionsLoading}
          onCreateSession={handleCreateSession}
          currentSessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}
          isCreatingSession={isCreatingSession}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* App Details Header */}
        <div className="p-4 bg-background border-b border-border flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {app.app_name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <SupabaseConnect
              supabaseProject={supabaseProject}
              setSupabaseProject={setSupabaseProject}
            />
            <Button
              variant="outline"
              onClick={handleRecreateSandbox}
              disabled={isRecreatingSandbox}
              className="flex items-center gap-2"
            >
              {isRecreatingSandbox ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recreating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Recreate Sandbox
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleResetApp}
              disabled={isResetting}
              className="flex items-center gap-2"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reset App
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => exportCode()}
              className="flex items-center gap-2"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Code
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Session Error Alert */}
        {sessionError && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{sessionError}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-4 gap-4 flex overflow-hidden">
          {/* Chat Window */}
          <Card className="flex-1">
            <CardContent className="p-4 h-full">
              {currentSessionId ? (
                <Chat
                  key={currentSessionId}
                  appId={appId}
                  apiUrl={app.api_url || ""}
                  authToken={authToken || ""}
                  sessionId={currentSessionId}
                  onResponseComplete={handleRefresh}
                  onSessionError={handleSessionError}
                  supabase_project={supabaseProject}
                />
              ) : (
                <div className="flex h-full items-center justify-center flex-col gap-4 text-muted-foreground">
                  <p>
                    Select a session from the sidebar or create a new one to
                    start chatting
                  </p>
                  <Button
                    onClick={handleCreateSession}
                    disabled={isCreatingSession}
                  >
                    {isCreatingSession ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create New Session"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="w-1/2 bg-card">
            <CardContent className="relative h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 border rounded-lg p-1 bg-background">
                  <button
                    onClick={() => setViewMode("mobile")}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      viewMode === "mobile"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Mockup
                  </button>
                  <button
                    onClick={() => setViewMode("qr")}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      viewMode === "qr"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    View in Mobile
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      app.app_url && window.open(app.app_url, "_blank")
                    }
                    className="h-6 px-2 flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1">
                {viewMode === "mobile" ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <MobileMockup>
                      <iframe
                        key={iframeKey}
                        src={app.app_url || ""}
                        style={{
                          height: "100%",
                        }}
                      />
                    </MobileMockup>
                  </div>
                ) : (
                  <div className="h-full w-full rounded-lg p-4 overflow-auto flex items-center justify-center">
                    <QRCodeDisplay url={app.app_url || ""} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <DiscordSupportButton />
      </div>
    </>
  );
}
