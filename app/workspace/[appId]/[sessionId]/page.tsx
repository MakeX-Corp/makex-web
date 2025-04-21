// workspace/[appId]/[sessionId]/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { use } from "react";
import {
  AlertCircle,
  PanelRightClose,
  PanelRightOpen,
  Laptop,
} from "lucide-react";

// Import shadcn components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Hard-coded mock function to simulate fetching a specific session
const getSession = async (appId: string, sessionId: string) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mock session data
  const mockSessions: Record<string, Record<string, any>> = {
    app1: {
      session1: {
        id: "session1",
        name: "First Session",
        appId: "app1",
        createdAt: "2025-04-15T10:30:00Z",
        lastActivity: "2025-04-19T14:22:10Z",
        data: {
          leftContent: "This is the left panel content for session1 in app1",
          rightContent: "This is the right panel content for session1 in app1",
        },
      },
      session2: {
        id: "session2",
        name: "Second Session",
        appId: "app1",
        createdAt: "2025-04-16T09:15:30Z",
        lastActivity: "2025-04-18T11:05:45Z",
        data: {
          leftContent: "This is the left panel content for session2 in app1",
          rightContent: "This is the right panel content for session2 in app1",
        },
      },
    },
    app2: {
      session3: {
        id: "session3",
        name: "App 2 Session",
        appId: "app2",
        createdAt: "2025-04-17T15:45:20Z",
        lastActivity: "2025-04-19T16:30:00Z",
        data: {
          leftContent: "This is the left panel content for session3 in app2",
          rightContent: "This is the right panel content for session3 in app2",
        },
      },
    },
  };

  // Handle dynamic session IDs that start with "new-session-"
  if (sessionId.startsWith("new-session-")) {
    return {
      id: sessionId,
      name: `New Session for ${appId}`,
      appId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      data: {
        leftContent: `This is a new session for ${appId}. Left panel content.`,
        rightContent: `This is a new session for ${appId}. Right panel content.`,
      },
    };
  }

  // Check if app exists in our mock data
  if (!mockSessions[appId]) {
    return null;
  }

  // IMPORTANT: Check if this session belongs to this app
  if (!mockSessions[appId][sessionId]) {
    console.log(`Session ${sessionId} does not belong to app ${appId}`);
    return null;
  }

  // Return the session if it exists for this app
  return mockSessions[appId][sessionId];
};

interface PageProps {
  params: any;
}

export default function WorkspaceSessionPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const appId = (unwrappedParams as { appId: string }).appId;
  const sessionId = (unwrappedParams as { sessionId: string }).sessionId;

  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "loading" | "valid" | "invalid" | "error"
  >("loading");

  // State for mobile/tablet panel view
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // For the app display name
  const getAppDisplayName = (id: string) => {
    return id === "app1"
      ? "Application One"
      : id === "app2"
      ? "Application Two"
      : `App ${id}`;
  };

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        console.log(`Loading session ${sessionId} for app ${appId}`);
        setValidationStatus("loading");

        // Fetch the specific session data
        const sessionData = await getSession(appId, sessionId);

        if (!isMounted) return;

        if (sessionData) {
          console.log(`Successfully loaded session ${sessionId}`);
          setSession(sessionData);
          setValidationStatus("valid");
        } else {
          console.log(`Session ${sessionId} not found for app ${appId}`);
          setValidationStatus("invalid");
        }

        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading session:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load session")
        );
        setValidationStatus("error");
        setLoading(false);
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [appId, sessionId]); // Re-run when appId or sessionId changes

  if (loading) {
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
            <Button variant="outline" disabled>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
              Loading...
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          </div>
        </header>
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Session</AlertTitle>
            <AlertDescription>
              <p>Unable to load the requested session.</p>
              <p className="text-sm mt-2">{error.message}</p>
              <Button
                variant="outline"
                onClick={() => router.push(`/workspace/${appId}`)}
                className="mt-4"
              >
                Return to App Homepage
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (validationStatus === "invalid") {
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
          </div>
        </header>
        <div className="flex-1 p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Not Found</AlertTitle>
            <AlertDescription>
              <p>
                The session{" "}
                <code className="px-1 py-0.5 bg-muted rounded text-xs">
                  {sessionId}
                </code>{" "}
                does not exist or does not belong to app{" "}
                <code className="px-1 py-0.5 bg-muted rounded text-xs">
                  {appId}
                </code>
                .
              </p>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="default"
                  onClick={() => router.push(`/workspace/${appId}`)}
                >
                  Go to Available Sessions
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Create a new session and navigate to it
                    const sessionId = `new-session-${Date.now()}`;
                    router.push(`/workspace/${appId}/${sessionId}`);
                  }}
                >
                  Create New Session
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Render normal view for valid session
  return (
    <div className="flex flex-col h-screen">
      {/* Main content - Desktop view: Grid, Mobile view: Sheet */}
      <div className="flex-1 p-4 overflow-auto">
        {/* For desktop/tablet view - side by side */}
        <div className="hidden lg:grid grid-cols-2 gap-4 h-full">
          {/* Left panel */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Left Component</CardTitle>
              <CardDescription>Session: {session.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg h-64 overflow-auto">
                <p>{session.data.leftContent}</p>
              </div>
            </CardContent>
          </Card>

          {/* Right panel */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Right Component</CardTitle>
              <CardDescription>Session: {session.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg h-64 overflow-auto">
                <p>{session.data.rightContent}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* For mobile view - stacked with toggle */}
        <div className="lg:hidden space-y-4">
          {/* Left panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Left Component</CardTitle>
                <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      {rightPanelOpen ? (
                        <PanelRightClose className="h-4 w-4" />
                      ) : (
                        <PanelRightOpen className="h-4 w-4" />
                      )}
                      <span className="ml-2">
                        {rightPanelOpen
                          ? "Hide Right Panel"
                          : "Show Right Panel"}
                      </span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[80%] sm:w-[540px] p-0">
                    <Card className="h-full border-0">
                      <CardHeader>
                        <CardTitle>Right Component</CardTitle>
                        <CardDescription>Session: {session.id}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 border rounded-lg h-[calc(100vh-180px)] overflow-auto">
                          <p>{session.data.rightContent}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </SheetContent>
                </Sheet>
              </div>
              <CardDescription>Session: {session.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg h-64 overflow-auto">
                <p>{session.data.leftContent}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
