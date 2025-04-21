"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { use } from "react";
import { AlertCircle, Smartphone, MessageSquare } from "lucide-react";
import { getSession, SessionData } from "@/lib/session-service";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Preview } from "@/components/workspace/preview";
import { ChatInput } from "@/components/workspace/chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // State for active tab/panel in mobile/tablet view
  const [activeView, setActiveView] = useState<"chat" | "preview">("chat");

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
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 sm:p-6">
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
      <div className="flex-1 p-4 sm:p-6">
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
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                variant="default"
                onClick={() => router.push(`/workspace/${appId}`)}
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
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
    <div className="flex-1 p-2 sm:p-4 overflow-auto h-full">
      {/* Desktop view - side by side */}
      <div className="hidden lg:grid grid-cols-2 gap-4 h-full">
        {/* Left panel */}
        <ChatInput onSendMessage={() => {}} />

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
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="chat"
            className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="flex-1">
              <ChatInput onSendMessage={() => {}} />
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
  );
}
