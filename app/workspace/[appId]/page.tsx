// workspace/[appId]/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { Loader2, AlertCircle } from "lucide-react";

// Import session service
import { getSessionsForApp, createNewSession } from "@/lib/session-service";

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

  useEffect(() => {
    let isMounted = true;

    async function handleSessionRouting() {
      try {
        console.log(`Handling session routing for app ID: ${appId}`);

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
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Loading Workspace</CardTitle>
            <CardDescription>{loadingText}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">
              This will just take a moment
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
