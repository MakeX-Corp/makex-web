"use client";

import { useSearchParams } from "next/navigation";
import { use } from "react";
import { SessionProvider } from "@/context/session-context";
import Workspace from "@/components/app/workspace";

interface PageProps {
  params: any;
}

export default function WorkspacePage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const appId = (unwrappedParams as { appId: string }).appId;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  return (
    <SessionProvider initialAppId={appId}>
      <Workspace initialSessionId={sessionId} />
    </SessionProvider>
  );
}
