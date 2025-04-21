// workspace/[appId]/[sessionId]/layout.tsx
"use client";

import { ReactNode, use, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Laptop } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Hard-coded mock function to simulate fetching sessions for an app
const getSessionsForApp = async (appId: string) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate different sessions for different app IDs
  const mockSessions: Record<string, Array<{ id: string; name: string }>> = {
    app1: [
      { id: "session1", name: "First Session" },
      { id: "session2", name: "Second Session" },
    ],
    app2: [{ id: "session3", name: "App 2 Session" }],
    // Default returns empty array for unknown apps
  };

  return mockSessions[appId] || [];
};

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

  const [sessions, setSessions] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        // Load all sessions for this app to display in the dropdown
        const sessionsData = await getSessionsForApp(appId);

        if (isMounted) {
          setSessions(sessionsData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        if (isMounted) {
          setLoading(false);
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
              <Button variant="outline" disabled>
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                Loading sessions...
              </Button>
            ) : (
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
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        <div className="flex items-center">
                          {session.id === sessionId && (
                            <Check className="mr-2 h-4 w-4 text-primary" />
                          )}
                          <span>{session.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectItem value={`new-session-${Date.now()}`}>
                    + Create New Session
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* App switcher dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Switch App <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Applications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/workspace/app1">
                    <div className="flex items-center">
                      {appId === "app1" && (
                        <Check className="mr-2 h-4 w-4 text-primary" />
                      )}
                      <span>Application One</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/workspace/app2">
                    <div className="flex items-center">
                      {appId === "app2" && (
                        <Check className="mr-2 h-4 w-4 text-primary" />
                      )}
                      <span>Application Two</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* The actual page content */}
      {children}
    </div>
  );
}
