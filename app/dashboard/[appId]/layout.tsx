"use client";

import { ReactNode, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Intercom from "@intercom/messenger-js-sdk";

// This layout will be shared by all pages under /dashboard/[appId]
export default function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  const { user } = useApp();
  useEffect(() => {
    if (user) {
      Intercom({
        app_id: "rpyk16br",
        user_id: user.id,
        email: user.email,
      });
    }
  }, []);
  return (
    <div className="flex flex-col h-screen dark:bg-gray-950">
      {/* We'll move the header into the page component */}
      <main className="flex-1 overflow-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}
