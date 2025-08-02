"use client";
import { useState, useEffect } from "react";
import { useSession } from "@/context/session-context";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  Smartphone,
  MessageSquare,
  RefreshCw,
  Download,
  MoreVertical,
  Loader2,
  UploadCloud,
  Globe,
  Shuffle,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Preview } from "@/components/workspace/preview";
import { Chat } from "@/components/workspace/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionSelector } from "@/components/workspace/session-selector";
import { SessionsError } from "@/components/workspace/sessions-error";
import { createClient } from "@/utils/supabase/client";
import { dataURLToBlob } from "@/lib/screenshot-service";
import { DeployButton } from "@/components/workspace/deploy";
import { GitHubSyncModal } from "./github-sync-modal";
import { useToast } from "@/components/ui/use-toast";
import { useApp } from "@/context/AppContext";
interface WorkspaceContentProps {
  initialSessionId: string | null;
}

export default function WorkspaceContent({
  initialSessionId,
}: WorkspaceContentProps) {
  const {
    appId,
    appName,
    sessions,
    loadingSessions,
    sessionsError,
    currentSessionId,
    currentSessionError,
    initializeApp,
    switchSession,
    createSession,
    github_sync_repo,
    refreshApp,
  } = useSession();

  const { theme } = useTheme();
  const [githubSyncOpen, setGitHubSyncOpen] = useState(false);

  // State for UI elements
  const [activeView, setActiveView] = useState<"chat" | "preview">("chat");
  const [isResetting, setIsResetting] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // State to manage the iframe refresh
  const [iframeKey, setIframeKey] = useState<string>(
    Math.random().toString(36).substring(2, 15),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track window width for responsive design
  const [windowWidth, setWindowWidth] = useState(0);

  const [state, setState] = useState<any>(null);
  const supabase = createClient();
  useEffect(() => {
    if (appId) {
      // Initial fetch
      const fetchInitialState = async () => {
        const res = await fetch("/api/sandbox?appId=" + appId, {
          method: "GET",
        });

        const data = await res.json();
        if (data.error) {
          console.error("Initial fetch error:", data.error);
        } else {
          setState(data);
          console.log(data);
          if (data?.sandbox_status === "paused") {
            await resumeSandbox();
          }
        }
      };

      fetchInitialState();

      // Realtime subscription
      const channel = supabase
        .channel(`realtime:user_sandboxes:${appId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_sandboxes",
            filter: `app_id=eq.${appId}`,
          },
          (payload) => {
            console.log("🔁 Realtime update:", payload);
            const newState = {
              sandbox_status: payload.new.sandbox_status,
              expo_status: payload.new.expo_status,
              app_status: payload.new.app_status,
            };
            setState(newState);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [appId]);

  const resumeSandbox = async () => {
    try {
      const response = await fetch("/api/sandbox", {
        method: "PATCH",
        body: JSON.stringify({
          appId,
          appName,
          targetState: "resume",
        }),
      });
    } catch (error) {
      console.error("Error creating sandbox:", error);
    }
  };

  // Effect to set window width on mount and resize
  useEffect(() => {
    // Set initial width
    setWindowWidth(window.innerWidth);

    // Update width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load sessions when component mounts or appId changes
  useEffect(() => {
    if (appId) {
      initializeApp(appId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]); // Only depend on appId

  const exportCode = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/code/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
      a.download = `${appName || "app_export"}.zip`;
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
        },
        body: JSON.stringify({
          appId,
        }),
      });

      refreshPreview();
      if (!response.ok) throw new Error("Failed to reset state");
    } catch (error) {
      console.error("Error resetting state:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const remixApp = async () => {
    try {
      setIsRemixing(true);
      const response = await fetch("/api/app/remix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appId,
        }),
      });
      if (!response.ok) throw new Error("Failed to remix app");
      
      const data = await response.json();
      return data.appId || appId;
    } catch (error) {
      console.error("Error remixing app:", error);
      return appId;
    } finally {
      setIsRemixing(false);
    }
  };

  // Function to refresh the iframe
  const refreshPreview = async () => {
    setIsRefreshing(true);
    setIframeKey(Math.random().toString(36).substring(2, 15));
    if(state?.sandbox_status === 'paused'){
      await resumeSandbox();
    }
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

  // Determine if we're on mobile/tablet or desktop
  const isDesktop = windowWidth >= 1024; // lg breakpoint is 1024px

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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
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
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    exportCode();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Zip
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setGitHubSyncOpen(true);
                  }}
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub Sync
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                remixApp();
              }}
              disabled={isRemixing}
              className="flex items-center gap-2"
            >
              {isRemixing ? (
                <>
                  <Shuffle className="h-4 w-4 animate-spin" />
                  <span>Remixing...</span>
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4" />
                  <span>Remix App</span>
                </>
              )}
            </Button>

            <DeployButton appId={appId} />
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
                  remixApp();
                }}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Remix App
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  exportCode();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setGitHubSyncOpen(true);
                }}
              >
                <svg
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub Sync
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Deploy
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      window.open("https://discord.gg/3EsUgb53Zp", "_blank")
                    }
                    disabled={isDeploying}
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Web
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer opacity-50"
                    onClick={() =>
                      window.open("https://discord.gg/3EsUgb53Zp", "_blank")
                    }
                  >
                    <img
                      src={
                        theme === "dark"
                          ? "/icons/apple-dark.svg"
                          : "/icons/apple.svg"
                      }
                      alt="App Store"
                      className="h-4 w-4 mr-2"
                    />
                    App Store
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer opacity-50"
                    onClick={() =>
                      window.open("https://discord.gg/3EsUgb53Zp", "_blank")
                    }
                  >
                    <img
                      src={
                        theme === "dark"
                          ? "/icons/play-store-dark.svg"
                          : "/icons/play-store.svg"
                      }
                      alt="Play Store"
                      className="h-4 w-4 mr-2"
                    />
                    Play Store
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
                    remixApp();
                  }}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Remix App
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    exportCode();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setGitHubSyncOpen(true);
                  }}
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub Sync
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Deploy
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        window.open("https://discord.gg/3EsUgb53Zp", "_blank")
                      }
                      disabled={isDeploying}
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-2" />
                          Web
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer opacity-50"
                      onClick={() =>
                        window.open("https://discord.gg/3EsUgb53Zp", "_blank")
                      }
                    >
                      <img
                        src={
                          theme === "dark"
                            ? "/icons/apple-dark.svg"
                            : "/icons/apple.svg"
                        }
                        alt="App Store"
                        className="h-4 w-4 mr-2"
                      />
                      App Store
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer opacity-50"
                      onClick={() =>
                        window.open("https://discord.gg/3EsUgb53Zp", "_blank")
                      }
                    >
                      <img
                        src={
                          theme === "dark"
                            ? "/icons/play-store-dark.svg"
                            : "/icons/play-store.svg"
                        }
                        alt="Play Store"
                        className="h-4 w-4 mr-2"
                      />
                      Play Store
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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
          {/* Only render the desktop or mobile view based on screen size */}
          {windowWidth > 0 && (
            <>
              {isDesktop ? (
                // Desktop view - side by side layout
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* Left panel - Chat */}

                  <Chat
                    sessionId={currentSessionId || initialSessionId || ""}
                    onResponseComplete={handleResponseComplete}
                    onSessionError={() => {}}
                    containerState={state?.sandbox_status}
                  />

                  {/* Right panel - Preview */}

                  <Preview
                    iframeKey={iframeKey}
                    isRefreshing={isRefreshing}
                    onRefresh={refreshPreview}
                    state={state}
                  />
                </div>
              ) : (
                // Mobile/tablet view - tabbed interface with persistent components
                <div className="h-full">
                  <Tabs
                    defaultValue="chat"
                    value={activeView}
                    onValueChange={(v) =>
                      setActiveView(v as "chat" | "preview")
                    }
                    className="h-full flex flex-col"
                  >
                    <TabsList className="grid grid-cols-2 mb-2">
                      <TabsTrigger
                        value="chat"
                        className="flex items-center gap-2"
                      >
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

                    <div className="flex-1 relative">
                      {/* Both components are always rendered, but we control visibility with CSS */}
                      <div
                        className={`absolute inset-0 ${activeView === "chat" ? "block" : "hidden"}`}
                      >
                        <Chat
                          sessionId={currentSessionId || initialSessionId || ""}
                          onResponseComplete={handleResponseComplete}
                          onSessionError={() => {}}
                          containerState={state?.sandbox_status}
                        />
                      </div>

                      <div
                        className={`absolute inset-0 ${activeView === "preview" ? "block" : "hidden"}`}
                      >
                        <Preview
                          iframeKey={iframeKey}
                          isRefreshing={isRefreshing}
                          onRefresh={refreshPreview}
                          state={state}
                        />
                      </div>
                    </div>
                  </Tabs>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      {/* At the end of the component, render the modal */}
      <GitHubSyncModal
        open={githubSyncOpen}
        onClose={() => setGitHubSyncOpen(false)}
        appId={appId}
        github_sync_repo={github_sync_repo}
        onRefresh={refreshApp}
      />
    </div>
  );
}
