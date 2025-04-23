"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { SessionProvider } from "@/context/session-context";
import WorkspaceContent from "@/components/workspace/workspace-content";

interface PageProps {
  params: any;
}

export default function WorkspacePage({ params }: PageProps) {
  // Unwrap params using React.use() to fix the Next.js warning
  const unwrappedParams = use(params);
  // Type assertion to tell TypeScript that unwrappedParams has an appId property
  const appId = (unwrappedParams as { appId: string }).appId;

  // Get session ID from query params if available
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  return (
    <SessionProvider initialAppId={appId}>
      <WorkspaceContent initialSessionId={sessionId} />
    </SessionProvider>
  );
}
