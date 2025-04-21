"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { Loader2 } from "lucide-react";

// Import shadcn components
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Mock API functions with proper TypeScript types
const getSessionsForApp = (
  appId: string
): Promise<Array<{ id: string; name: string }>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sessions: Record<string, Array<{ id: string; name: string }>> = {
        app1: [
          { id: "session1", name: "First Session" },
          { id: "session2", name: "Second Session" },
        ],
        app2: [{ id: "session3", name: "App 2 Session" }],
      };

      resolve(sessions[appId] || []);
    }, 100);
  });
};

const createSession = (
  appId: string
): Promise<{ id: string; name: string; appId: string; createdAt: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sessionId = `new-session-${Date.now()}`;
      resolve({
        id: sessionId,
        name: `New Session for ${appId}`,
        appId,
        createdAt: new Date().toISOString(),
      });
    }, 100);
  });
};

interface PageProps {
  params: any;
}

export default function WorkspaceAppPage({ params }: PageProps) {
  // Unwrap params using React.use() to fix the Next.js warning
  const unwrappedParams = use(params);
  // Type assertion to tell TypeScript that unwrappedParams has an appId property
  const appId = (unwrappedParams as { appId: string }).appId;

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string>(
    "Loading app sessions..."
  );

  useEffect(() => {
    let isMounted = true;

    async function handleSessionRouting() {
      try {
        console.log(`Loading sessions for app ID: ${appId}`);

        if (isMounted) setLoadingText("Loading app sessions...");

        // Get sessions for this app
        const sessions = await getSessionsForApp(appId);

        if (!isMounted) return;

        // Either use first session or create new one
        let sessionId: string;
        if (sessions.length > 0) {
          sessionId = sessions[0].id;
          console.log(`Using existing session: ${sessionId}`);
          if (isMounted)
            setLoadingText(`Redirecting to session: ${sessionId}...`);
        } else {
          if (isMounted) setLoadingText("Creating new session...");
          const newSession = await createSession(appId);
          sessionId = newSession.id;
          console.log(`Created new session: ${sessionId}`);
          if (isMounted)
            setLoadingText(`Redirecting to new session: ${sessionId}...`);
        }

        // Navigate to the session page
        router.replace(`/workspace/${appId}/${sessionId}`);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to handle session routing:", err);
        setError("Could not load or create a session");
        setIsLoading(false);
      }
    }

    handleSessionRouting();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [appId, router]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Loading Workspace</CardTitle>
        <CardDescription>
          Finding available sessions for this application
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-center text-muted-foreground">{loadingText}</p>
      </CardContent>
    </Card>
  );
}
