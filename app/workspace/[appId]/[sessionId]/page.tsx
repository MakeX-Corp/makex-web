// workspace/[appId]/[sessionId]/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { AlertCircle, PanelRightClose, PanelRightOpen } from "lucide-react";
import { getSession, SessionData } from "@/lib/session-service";
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
import { Preview } from "@/components/workspace/preview";
import { ChatInput } from "@/components/workspace/chat";

interface PageProps {
  params: any;
}

export default function WorkspaceSessionPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const appId = (unwrappedParams as { appId: string }).appId;
  const sessionId = (unwrappedParams as { sessionId: string }).sessionId;

  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "loading" | "valid" | "invalid" | "error"
  >("loading");

  // State for mobile/tablet panel view
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Load session data
  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        console.log(`Loading session ${sessionId} for app ${appId}`);
        setValidationStatus("loading");

        // Fetch the specific session data using the service
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
  }, [appId, sessionId]);

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (validationStatus === "invalid") {
    return (
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
    );
  }

  // Render normal view for valid session
  return (
    <>
      {/* Main content - Desktop view: Grid, Mobile view: Sheet */}
      <div className="flex-1 p-4 overflow-auto">
        {/* For desktop/tablet view - side by side */}
        <div className="hidden lg:grid grid-cols-2 gap-4 h-full">
          {/* Left panel */}
          <ChatInput onSendMessage={() => {}} />

          {/* Right panel */}
          <Preview />
        </div>

        {/* For mobile view - stacked with toggle */}
        <div className="lg:hidden space-y-4">
          {/* Left panel */}
          <Card className="flex flex-col">
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
                    <Card className="h-full border-0 flex flex-col">
                      <CardHeader>
                        <CardTitle>Right Component</CardTitle>
                        <CardDescription>
                          Edit your right panel content
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow"></CardContent>
                      <CardFooter className="pt-2 border-t flex justify-end"></CardFooter>
                    </Card>
                  </SheetContent>
                </Sheet>
              </div>
              <CardDescription>Edit your left panel content</CardDescription>
            </CardHeader>
            <CardContent></CardContent>
            <CardFooter className="pt-2 border-t flex justify-end"></CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
