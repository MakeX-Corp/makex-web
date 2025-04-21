"use client";

import { ReactNode } from "react";

// This layout will be shared by both the appId page and the appId/sessionId page
export default function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  return (
    <div className="workspace-container">
      <header className="workspace-header"></header>

      <main>{children}</main>
    </div>
  );
}
