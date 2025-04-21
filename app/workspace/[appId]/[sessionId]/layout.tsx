// workspace/[appId]/[sessionId]/layout.tsx
/*

"use client";

import { ReactNode, use, useEffect, useState } from "react";
import Link from "next/link";

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
  const [currentApp, setCurrentApp] = useState(appId);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        // Load all sessions for this app to display in the sidebar
        const sessionsData = await getSessionsForApp(appId);

        if (isMounted) {
          setSessions(sessionsData);
          setLoading(false);
          setCurrentApp(appId);
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

  return (
    <div className="session-layout flex min-h-screen">

      <aside className="session-sidebar w-64 border-r p-4 bg-gray-50">
        <div className="app-indicator mb-4 p-2 bg-blue-100 border border-blue-200 rounded">
          <h3 className="text-sm font-semibold text-gray-600">Current App</h3>
          <div className="text-lg font-mono text-blue-800">{appId}</div>
        </div>

        <h3 className="font-bold text-lg mb-2">Available Sessions</h3>

        {loading ? (
          <div className="p-3 bg-gray-100 rounded">
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
              <p className="text-sm">Loading sessions...</p>
            </div>
          </div>
        ) : (
          <>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No sessions available
              </p>
            ) : (
              <ul className="session-list space-y-1">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className={`rounded ${
                      session.id === sessionId
                        ? "bg-blue-200 text-blue-800"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <Link
                      href={`/workspace/${appId}/${session.id}`}
                      className="block p-2"
                    >
                      {session.name}
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        {session.id}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="new-session mt-4">
              <Link
                href={`/workspace/${appId}/new-session-${Date.now()}`}
                className="block w-full py-2 px-4 bg-blue-500 text-white rounded text-center hover:bg-blue-600 transition"
              >
                Create New Session
              </Link>
            </div>
          </>
        )}

        <div className="app-switcher mt-8 pt-4 border-t">
          <h3 className="font-bold mb-2">Switch App</h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/workspace/app1`}
              className={`p-2 border rounded text-center ${
                appId === "app1"
                  ? "bg-blue-100 border-blue-300"
                  : "hover:bg-gray-100"
              }`}
            >
              App 1
            </Link>
            <Link
              href={`/workspace/app2`}
              className={`p-2 border rounded text-center ${
                appId === "app2"
                  ? "bg-blue-100 border-blue-300"
                  : "hover:bg-gray-100"
              }`}
            >
              App 2
            </Link>
          </div>
        </div>
      </aside>

      <main className="session-main flex-1 p-4">
        <div className="debug-panel mb-4 p-3 border border-gray-200 rounded bg-gray-50 text-sm">
          <div className="font-semibold mb-1">Debug Information</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="font-mono text-gray-600">App ID:</span>
              <span className="ml-2 px-1 bg-blue-100 rounded font-mono">
                {appId}
              </span>
            </div>
            <div>
              <span className="font-mono text-gray-600">Session ID:</span>
              <span className="ml-2 px-1 bg-green-100 rounded font-mono">
                {sessionId}
              </span>
            </div>
            <div>
              <span className="font-mono text-gray-600">Sessions Count:</span>
              <span className="ml-2">{sessions.length}</span>
            </div>
            <div>
              <span className="font-mono text-gray-600">Is Session Valid:</span>
              <span className="ml-2">
                {sessions.some((s) => s.id === sessionId)
                  ? "✅ Valid"
                  : sessionId.startsWith("new-session-")
                  ? "⚠️ New"
                  : "❌ Invalid"}
              </span>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
*/

/*
// workspace/[appId]/[sessionId]/layout.tsx
"use client";

import { ReactNode, use, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronsUpDown, Laptop } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    
      <header className="border-b px-6 py-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Laptop className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">
              {getAppDisplayName(appId)}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
          
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

     
      <div className="flex-1 grid grid-cols-2 gap-4 p-6 overflow-auto">
      
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Left Component</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg h-64 flex items-center justify-center">
              <p className="text-muted-foreground">
                Left component content will go here
              </p>
            </div>
          </CardContent>
        </Card>

      
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Right Component</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg h-64 flex items-center justify-center">
              <p className="text-muted-foreground">
                Right component content will go here
              </p>
            </div>

           
            <div className="mt-6">{children}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
*/

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
