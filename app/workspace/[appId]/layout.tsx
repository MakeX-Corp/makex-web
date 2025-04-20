// app/workspace/[appId]/layout.tsx
"use client";
import { ReactNode } from "react";
import { SessionSelector } from "@/components/workspace/session-selector";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { appId: string };
}) {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">My App</h1>
          <SessionSelector />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
