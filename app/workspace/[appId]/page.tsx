"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { AlertCircle } from "lucide-react";
import { getSessionsForApp, createNewSession } from "@/lib/session-service";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [appName, setAppName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function handleSessionRouting() {
      try {
        if (isMounted) setLoadingText("Loading app sessions...");

        // Get sessions for this app (now also returns appName)
        const { sessions, appName: fetchedAppName } = await getSessionsForApp(
          appId
        );

        if (isMounted) {
          setAppName(fetchedAppName || `App ${appId}`);
        }

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
          const newSession = await createNewSession(appId);
          if (!newSession) {
            throw new Error("Failed to create a new session");
          }
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
        toast.error("Failed to load or create session");
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
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
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

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center max-w-md text-center p-6">
        {/* App name heading */}
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {appName ? appName : "Loading Workspace"}
        </h1>

        {/* Loading status text */}
        <p className="text-sm text-muted-foreground mb-8">{loadingText}</p>

        {/* Pulsing circles animation */}
        <div className="relative flex justify-center mb-8">
          {/* Outer pulsing circle */}
          <div className="absolute w-16 h-16 bg-primary/10 rounded-full animate-ping"></div>

          {/* Middle pulsing circle */}
          <div
            className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
