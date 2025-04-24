"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "@/context/session-context";
import {
  AlertCircle,
  Smartphone,
  MessageSquare,
  RefreshCw,
  Download,
  MoreVertical,
  Database,
  Loader2,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Preview } from "@/components/workspace/preview";
import { Chat } from "@/components/workspace/chat";
import { SupabaseConnect } from "@/components/supabase-connect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionSelector } from "@/components/workspace/session-selector";
import { SessionsError } from "@/components/workspace/sessions-error";
import { getAuthToken } from "@/utils/client/auth";
interface WorkspaceContentProps {
  initialSessionId: string | null;
}

export default function WorkspaceContent({
  initialSessionId,
}: WorkspaceContentProps) {
  const {
    appId,
    appName,
    apiUrl,
    sessions,
    supabaseProject,
    setSupabaseProject,
    loadingSessions,
    sessionsError,
    currentSession,
    currentSessionId,
    loadingCurrentSession,
    currentSessionError,
    initializeApp,
    switchSession,
    createSession,
  } = useSession();

  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    setAuthToken(token);
  }, []);
  // State for the UI elements
  const [activeView, setActiveView] = useState<"chat" | "preview">("chat");
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // State to manage the iframe refresh
  const [iframeKey, setIframeKey] = useState<string>(
    Math.random().toString(36).substring(2, 15)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Load sessions when component mounts or appId changes
  useEffect(() => {
    if (appId) {
      initializeApp(appId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]); // Only depend on appId

  // Fix for the useEffect that handles session switching
  useEffect(() => {
    if (!appId || loadingSessions) return;

    // Add a flag to prevent multiple calls
    let isHandled = false;

    const handleInitialSession = async () => {
      // Prevent duplicate calls
      if (isHandled || currentSessionId) return;
      isHandled = true;

      // First, check URL for sessionId
      const urlSessionId =
        typeof window !== "undefined"
          ? new URL(window.location.href).searchParams.get("sessionId")
          : null;

      if (urlSessionId) {
        // Use session ID from URL if available
        await switchSession(urlSessionId);
      } else if (initialSessionId) {
        // Use provided initial session ID if URL doesn't have one
        await switchSession(initialSessionId);
      } else if (sessions.length > 0) {
        // Use first session as fallback
        await switchSession(sessions[0].id);
      } else {
        // Create new session if no sessions exist
        await createSession();
      }
    };

    handleInitialSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, initialSessionId, loadingSessions, sessions.length]);

  const exportCode = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/code/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          apiUrl: apiUrl,
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

  const resetApp = async () => {
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
    } catch (error) {
      console.error("Error resetting state:", error);
    } finally {
      setIsResetting(false);
    }
  };

  // Function to refresh the iframe
  const refreshPreview = () => {
    setIsRefreshing(true);
    setIframeKey(Math.random().toString(36).substring(2, 15));

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Handler for when chat response is complete
  const handleResponseComplete = () => {
    refreshPreview();
  };

  // If there's an error loading sessions, show an error
  if (sessionsError) {
    return <SessionsError sessionsError={sessionsError} />;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation bar */}
      <header className="border-b px-3 sm:px-6 py-3 bg-background">
        {/* Desktop view with full button bar - only at larger screen sizes */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {appName}
              </h1>
            </div>

            {/* Session selector on the same line for desktop */}
            <SessionSelector />
          </div>

          <div className="flex items-center space-x-2">
            {/* <SupabaseConnect
              supabaseProject={supabaseProject}
              setSupabaseProject={setSupabaseProject}
            /> */}

            <Button
              variant="outline"
              onClick={() => {
                resetApp();
              }}
              disabled={isResetting}
              className="flex items-center gap-2"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset App</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                exportCode();
              }}
              className="flex items-center gap-2"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export Code</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Medium layout - with dots but session selector inline */}
        <div className="hidden md:flex lg:hidden items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {appName}
              </h1>
            </div>

            {/* Session selector on the same line for medium screens */}
            <SessionSelector />
          </div>

          {/* Three dots even for medium screen sizes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  resetApp();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset App
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  exportCode();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Code
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Database className="h-4 w-4 mr-2" />
                Supabase Connect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile view - stacked layout */}
        <div className="flex flex-col space-y-3 md:hidden">
          {/* App title and menu row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate max-w-[180px] sm:max-w-full">
                {appName}
              </h1>
            </div>

            {/* Mobile menu button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    resetApp();
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset App
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    exportCode();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Code
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Database className="h-4 w-4 mr-2" />
                  Supabase Connect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Session selector on new line only for mobile/tablet */}
          <div className="flex justify-start w-full">
            <SessionSelector />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Show session error */}
        {currentSessionError && (
          <div className="p-4 sm:p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Session Error</AlertTitle>
              <AlertDescription>
                <p>{currentSessionError}</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button
                    variant="default"
                    onClick={() => {
                      // Try to use first session if available or create new
                      if (sessions.length > 0) {
                        switchSession(sessions[0].id);
                      } else {
                        createSession();
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    {sessions.length > 0
                      ? "Use Existing Session"
                      : "Create New Session"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Show session content when a session is loaded */}
        <div className="p-2 sm:p-4 overflow-auto h-full">
          {/* Desktop view - side by side */}
          <div className="hidden lg:grid grid-cols-2 gap-4 h-full">
            {/* Left panel */}
            <Chat
              sessionId={currentSessionId || ""}
              onResponseComplete={handleResponseComplete}
              onSessionError={() => {}}
              authToken={authToken}
            />

            {/* Right panel */}
            <Preview
              iframeKey={iframeKey}
              isRefreshing={isRefreshing}
              onRefresh={refreshPreview}
            />
          </div>

          {/* Mobile/Tablet view - tabbed interface */}
          <div className="lg:hidden h-full">
            <Tabs
              defaultValue="chat"
              value={activeView}
              onValueChange={(v) => setActiveView(v as "chat" | "preview")}
              className="h-full flex flex-col"
            >
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="chat"
                className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <div className="flex-1">
                  <Chat
                    sessionId={currentSessionId || ""}
                    onResponseComplete={handleResponseComplete}
                    onSessionError={() => {}}
                    authToken={authToken}
                  />
                </div>
              </TabsContent>

              <TabsContent
                value="preview"
                className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <div className="flex-1">
                  <Preview
                    iframeKey={iframeKey}
                    isRefreshing={isRefreshing}
                    onRefresh={refreshPreview}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
