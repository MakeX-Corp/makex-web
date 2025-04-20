// app/workspace/[appId]/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// This is just a redirect page to default session
export default function WorkspacePage({
  params,
}: {
  params: { appId: string };
}) {
  const router = useRouter();
  const { appId } = params;

  useEffect(() => {
    // In a real app, you would fetch the latest session
    // For now, redirect to hardcoded session1
    router.push(`/workspace/${appId}/session1`);
  }, [appId, router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-4">Loading workspace...</h2>
        <Button
          variant="outline"
          onClick={() => router.push(`/workspace/${appId}/session1`)}
        >
          Go to Default Session
        </Button>
      </div>
    </div>
  );
}
