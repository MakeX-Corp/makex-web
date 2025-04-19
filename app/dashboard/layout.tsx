"use client";

import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { DashboardProvider } from "@/context/DashboardContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Logo Button will be handled by Sidebar component */}

      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full p-4">{children}</main>
    </div>
  );
}
