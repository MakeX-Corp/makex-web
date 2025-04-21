"use client";

import { ReactNode, use, useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { getSessionsForApp, SessionListItem } from "@/lib/session-service";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionSelector } from "@/components/dashboard/session-selector";
import { SupabaseConnect } from "@/components/supabase-connect";

import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
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
      <header className="border-b px-6 py-3 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {loading ? <Skeleton className="h-6 w-36" /> : appName}
              </h1>
            </div>

            {/* Session selector moved closer to app name */}
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
            {/* Buttons with skeleton states */}
            <div className="flex space-x-2">
              {loading ? (
                <Skeleton className="h-9 w-[140px]" /> // Skeleton for SupabaseConnect
              ) : (
                <SupabaseConnect
                  supabaseProject={supabaseProject}
                  setSupabaseProject={setSupabaseProject}
                />
              )}

              {loading ? (
                <Skeleton className="h-9 w-[110px]" /> // Skeleton for Reset App button
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
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Reset App
                    </>
                  )}
                </Button>
              )}

              {loading ? (
                <Skeleton className="h-9 w-[130px]" /> // Skeleton for Export Code button
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
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export Code
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Error message if sessions fail to load */}
            {error && (
              <button
                onClick={() => window.location.reload()}
                className="text-sm px-3 py-1 rounded border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
              >
                Failed to load sessions. Retry?
              </button>
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
