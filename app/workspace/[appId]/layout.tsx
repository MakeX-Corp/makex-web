"use client";

import { ReactNode } from "react";

// This layout will be shared by all pages under /workspace/[appId]
export default function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  return (
    <div className="flex flex-col h-screen dark:bg-gray-950">
      {/* We'll move the header into the page component */}
      <main className="flex-1 overflow-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}
