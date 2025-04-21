"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Preview } from "@/components/workspace/preview";
import { ChatInput } from "@/components/workspace/chat";
import { SupabaseConnect } from "@/components/supabase-connect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionSelector } from "@/components/workspace/session-selector";

interface WorkspaceContentProps {
  initialSessionId: string | null;
}

export default function WorkspaceContent({
  initialSessionId,
}: WorkspaceContentProps) {
  const router = useRouter();
  const {
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
  } = useSession();

  // State for the UI elements
  const [activeView, setActiveView] = useState<"chat" | "preview">("chat");
  const [supabaseProject, setSupabaseProject] = useState<string | null>(null);
  const [isResetingApp, setIsResetingApp] = useState(false);
  const [isExportingCode, setIsExportingCode] = useState(false);

  // Load sessions when component mounts or appId changes
  useEffect(() => {
    if (appId) {
      loadSessions(appId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]); // Only depend on appId, not loadSessions which could cause re-renders

  // Switch to initialSessionId if provided, otherwise use first session or create new one
  useEffect(() => {
    if (!appId || loadingSessions) return;

    // Add a flag to prevent multiple calls
    let isHandled = false;

    const handleInitialSession = async () => {
      // Prevent duplicate calls
      if (isHandled || currentSessionId) return;
      isHandled = true;

      if (initialSessionId) {
        // Use provided session ID
        await switchSession(initialSessionId);
      } else if (sessions.length > 0) {
        // Use first session
        await switchSession(sessions[0].id);
      } else {
        // Create new session
        await createSession();
      }
    };

    handleInitialSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, initialSessionId, loadingSessions, sessions.length]);

  // If there's an error loading sessions, show an error
  if (sessionsError) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>{sessionsError}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
                <Button
                  variant="default"
                  onClick={() => router.push("/dashboard")}
                >
                  Return to Dashboard
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // If sessions are still loading, show a loading state
  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center max-w-md text-center p-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Loading Workspace
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Loading app sessions...
          </p>
          <div className="relative flex justify-center mb-8">
            <div className="absolute w-16 h-16 bg-primary/10 rounded-full animate-ping"></div>
            <div
              className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen dark:bg-gray-950">
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
            <SupabaseConnect
              supabaseProject={supabaseProject}
              setSupabaseProject={setSupabaseProject}
            />

            <Button
              variant="outline"
              onClick={() => {
                setIsResetingApp(true);
                // Add your reset functionality here
                setTimeout(() => setIsResetingApp(false), 1000);
              }}
              disabled={isResetingApp}
              className="flex items-center gap-2"
            >
              {isResetingApp ? (
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
                setIsExportingCode(true);
                // Add your export functionality here
                setTimeout(() => setIsExportingCode(false), 1000);
              }}
              className="flex items-center gap-2"
              disabled={isExportingCode}
            >
              {isExportingCode ? (
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
                  setIsResetingApp(true);
                  // Add your reset functionality here
                  setTimeout(() => setIsResetingApp(false), 1000);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset App
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setIsExportingCode(true);
                  // Add your export functionality here
                  setTimeout(() => setIsExportingCode(false), 1000);
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
                    setIsResetingApp(true);
                    // Add your reset functionality here
                    setTimeout(() => setIsResetingApp(false), 1000);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset App
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setIsExportingCode(true);
                    // Add your export functionality here
                    setTimeout(() => setIsExportingCode(false), 1000);
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

        {/* Show loading state while loading a session */}
        {loadingCurrentSession && !currentSessionError && (
          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full max-w-md" />
              <Skeleton className="h-4 w-full max-w-xs" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64 hidden lg:block" />
              </div>
            </div>
          </div>
        )}

        {/* Show session content when a session is loaded */}
        {currentSession && !currentSessionError && !loadingCurrentSession && (
          <div className="p-2 sm:p-4 overflow-auto h-full">
            {/* Desktop view - side by side */}
            <div className="hidden lg:grid grid-cols-2 gap-4 h-full">
              {/* Left panel */}
              <ChatInput
                onSendMessage={() => {}}
                sessionId={currentSessionId || ""}
              />

              {/* Right panel */}
              <Preview />
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
                    <ChatInput
                      onSendMessage={() => {}}
                      sessionId={currentSessionId || ""}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="preview"
                  className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <div className="flex-1">
                    <Preview />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
