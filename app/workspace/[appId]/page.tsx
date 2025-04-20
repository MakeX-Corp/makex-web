"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext"; // Use the AppContext instead of useWorkspace

export default function WorkspacePage({ params }: { params: any }) {
  const router = useRouter();
  // Unwrap params using React.use() to fix the Next.js warning
  const unwrappedParams = use(params);
  // Type assertion to tell TypeScript that unwrappedParams has an appId property
  const appId = (unwrappedParams as { appId: string }).appId;

  // Use the session state from AppContext
  const { sessions, isLoading, createSession } = useApp();

  useEffect(() => {
    // Redirect to the first session when sessions are loaded
    if (!isLoading && sessions.length > 0) {
      router.push(`/workspace/${appId}/${sessions[0].id}`);
    }
  }, [sessions, isLoading, appId, router]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-4">Loading workspace...</h2>
        </div>
      </div>
    );
  }

  // Handle no sessions case
  if (sessions.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-4">No sessions found</h2>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const newSession = await createSession(
                  appId,
                  "Default Session"
                );
                router.push(`/workspace/${appId}/${newSession.id}`);
              } catch (err) {
                console.error("Failed to create session:", err);
                // Display an error message to the user if needed
              }
            }}
          >
            Create New Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-4">Redirecting to session...</h2>
        <Button
          variant="outline"
          onClick={() => router.push(`/workspace/${appId}/${sessions[0].id}`)}
        >
          Go to Default Session
        </Button>
      </div>
    </div>
  );
}
