// workspace/[appId]/[sessionId]/layout.tsx
"use client";

import { ReactNode, use, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Laptop, Plus } from "lucide-react";

// Import session service
import { getSessionsForApp, SessionListItem } from "@/lib/session-service";

// Import shadcn components
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        setLoading(true);

        // Load all sessions for this app to display in the dropdown
        const sessionsData = await getSessionsForApp(appId);

        if (isMounted) {
          setSessions(sessionsData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch sessions")
          );
          setLoading(false);
          toast.error("Failed to load sessions");
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [appId]); // Only re-fetch when appId changes

  // For the app display name
  const getAppDisplayName = (id: string) => {
    return id === "app1"
      ? "Application One"
      : id === "app2"
      ? "Application Two"
      : `App ${id}`;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation bar */}
      <header className="border-b px-6 py-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Laptop className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">
              {getAppDisplayName(appId)}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Session selector dropdown */}
            {loading ? (
              <div className="flex space-x-2 items-center">
                <Skeleton className="h-9 w-[280px]" />
              </div>
            ) : error ? (
              <div className="flex space-x-2 items-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="text-red-500"
                >
                  Failed to load sessions. Retry?
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2 items-center">
                <Select
                  defaultValue={sessionId}
                  onValueChange={(value) => {
                    // Navigate to the selected session
                    window.location.href = `/workspace/${appId}/${value}`;
                  }}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Available Sessions</SelectLabel>
                      {sessions.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No sessions found
                        </div>
                      ) : (
                        sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center">
                              <span>
                                {session.title ||
                                  `Session ${session.id.slice(0, 8)}`}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                    <SelectSeparator />
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* The actual page content */}
      {children}
    </div>
  );
}
