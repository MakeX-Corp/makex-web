// workspace/[appId]/[sessionId]/layout.tsx
"use client";

import { ReactNode, use, useEffect, useState } from "react";
import { getSessionsForApp, SessionListItem } from "@/lib/session-service";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionSelector } from "@/components/dashboard/session-selector";
import { SupabaseConnect } from "@/components/supabase-connect";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  Download,
  MoreVertical,
  Smartphone,
  Database,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function SessionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  const unwrappedParams = use(params);
  const appId = (unwrappedParams as { appId: string }).appId;
  const sessionId = (unwrappedParams as { sessionId: string }).sessionId;

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [appName, setAppName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [supabaseProject, setSupabaseProject] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        setLoading(true);

        // Load all sessions for this app to display in the dropdown
        const { sessions: sessionsData, appName: fetchedAppName } =
          await getSessionsForApp(appId);

        if (isMounted) {
          setSessions(sessionsData);
          setAppName(fetchedAppName || `App ${appId}`); // Fallback if no name is returned
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch sessions")
          );
          setLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [appId]); // Only re-fetch when appId changes

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
                {loading ? <Skeleton className="h-6 w-36" /> : appName}
              </h1>
            </div>

            {/* Session selector on the same line for desktop */}
            {loading ? (
              <Skeleton className="h-9 w-[230px]" />
            ) : error ? null : (
              <SessionSelector
                sessions={sessions}
                currentSessionId={sessionId}
                appId={appId}
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            {loading ? (
              <Skeleton className="h-9 w-[140px]" />
            ) : (
              <SupabaseConnect
                supabaseProject={supabaseProject}
                setSupabaseProject={setSupabaseProject}
              />
            )}

            {loading ? (
              <Skeleton className="h-9 w-[110px]" />
            ) : (
              <Button
                variant="outline"
                onClick={() => {}}
                disabled={false}
                className="flex items-center gap-2"
              >
                {false ? (
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
            )}

            {loading ? (
              <Skeleton className="h-9 w-[130px]" />
            ) : (
              <Button
                variant="outline"
                onClick={() => {}}
                className="flex items-center gap-2"
                disabled={false}
              >
                {false ? (
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
            )}
          </div>
        </div>

        {/* Medium layout - with dots but session selector inline */}
        <div className="hidden md:flex lg:hidden items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {loading ? <Skeleton className="h-6 w-36" /> : appName}
              </h1>
            </div>

            {/* Session selector on the same line for medium screens */}
            {loading ? (
              <Skeleton className="h-9 w-[230px]" />
            ) : error ? null : (
              <SessionSelector
                sessions={sessions}
                currentSessionId={sessionId}
                appId={appId}
              />
            )}
          </div>

          {/* Three dots even for medium screen sizes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {!loading && (
                <>
                  <DropdownMenuItem className="cursor-pointer">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset App
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Export Code
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Database className="h-4 w-4 mr-2" />
                    Supabase Connect
                  </DropdownMenuItem>
                </>
              )}
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
                {loading ? <Skeleton className="h-6 w-24 sm:w-36" /> : appName}
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
                {!loading && (
                  <>
                    <DropdownMenuItem className="cursor-pointer">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset App
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Download className="h-4 w-4 mr-2" />
                      Export Code
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Database className="h-4 w-4 mr-2" />
                      Supabase Connect
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Session selector on new line only for mobile/tablet */}
          <div className="flex justify-start w-full">
            {loading ? (
              <Skeleton className="h-9 w-full max-w-xs" />
            ) : error ? (
              <button
                onClick={() => window.location.reload()}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
              >
                Failed to load sessions. Retry?
              </button>
            ) : (
              <SessionSelector
                sessions={sessions}
                currentSessionId={sessionId}
                appId={appId}
              />
            )}
          </div>
        </div>
      </header>

      {/* The actual page content */}
      <main className="flex-1 overflow-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}
