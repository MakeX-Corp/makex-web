"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Settings,
  Sun,
  Moon,
  X,
  Search,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { useTheme } from "next-themes";

const DiscordIcon = () => {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
};
export default function Sidebar() {
  const {
    sidebarVisible,
    toggleSidebar,
    apps,
    currentAppId,
    isLoading,
    subscription,
    deleteApp,
  } = useApp();

  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Local state
  const [activeTab, setActiveTab] = useState("apps");
  const [appSearchTerm, setAppSearchTerm] = useState("");
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Filter apps based on search
  const filteredApps = appSearchTerm
    ? apps.filter(
        (app) =>
          app.app_name.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
          app.app_url.toLowerCase().includes(appSearchTerm.toLowerCase())
      )
    : apps;

  // Handle app selection
  const handleAppClick = (appId: string) => {
    router.push(`/dashboard/app/${appId}`);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  // Handle app deletion
  const handleDeleteApp = async (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingAppId(appId);

    try {
      await deleteApp(appId);

      // Check if they're deleting the currently open app
      if (pathname.includes(`/dashboard/app/${appId}`)) {
        // Redirect to dashboard if they're deleting the current app
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error deleting app:", error);
    } finally {
      setDeletingAppId(null);
    }
  };

  // Define sidebar tabs with routes
  const sidebarTabs = [
    {
      id: "apps",
      label: "Create",
      icon: <Plus size={18} />,
      path: "/dashboard",
      isExternal: false,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      path: "/dashboard/settings",
      isExternal: false,
    },
    {
      id: "help",
      label: "Help & Support",
      icon: <DiscordIcon />,
      path: "https://discord.gg/3EsUgb53Zp",
      isExternal: true,
    },
  ];

  return (
    <>
      {/* Backdrop - only visible when sidebar is open on mobile */}
      {sidebarVisible && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Logo Button to open sidebar */}
      <button
        className="fixed top-4 left-4 z-50 flex items-center justify-center"
        onClick={toggleSidebar}
      >
        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-[#ED64FC] text-white font-bold text-xl shadow-md transition-all duration-300 hover:scale-105 active:scale-95">
          <Image src="/logo.png" alt="MakeX Logo" width={24} height={24} />
        </div>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-background text-foreground border-r border-border shadow-lg transition-transform duration-300 ease-in-out ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex justify-between items-center border-b border-border">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[#ED64FC] text-white transition-colors duration-300">
              <Image src="/logo.png" alt="MakeX Logo" width={20} height={20} />
            </div>
            <span className="font-semibold text-lg">MakeX</span>
          </Link>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="transition-all duration-200"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="transition-all duration-200 hover:rotate-90"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <div className="p-2">
          <nav className="space-y-1">
            {sidebarTabs.map((tab) =>
              tab.isExternal ? (
                <a
                  key={tab.id}
                  href={tab.path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start transition-all duration-200"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </Button>
                </a>
              ) : (
                <Link key={tab.id} href={tab.path}>
                  <Button
                    variant={
                      pathname === tab.path ||
                      (tab.id === "apps" &&
                        pathname.startsWith("/dashboard/app/"))
                        ? "default"
                        : "ghost"
                    }
                    className="w-full justify-start transition-all duration-200"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </Button>
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Content based on active tab */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* App Search */}
            <div className="px-3 pb-2 pt-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="text"
                  placeholder="Search apps..."
                  className="pl-9 h-9 transition-all duration-200 focus:ring-2 focus:ring-[#ED64FC]"
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Apps List */}
            <div className="px-3 py-2 overflow-auto flex-1">
              <h3 className="px-3 text-xs font-medium uppercase text-muted-foreground mb-2">
                My Apps
              </h3>

              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredApps.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {appSearchTerm ? "No apps found" : "No apps created yet"}
                    </div>
                  )}

                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer group transition-all duration-200 ${
                        currentAppId === app.id
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => handleAppClick(app.id)}
                    >
                      <div className="flex items-center overflow-hidden">
                        <div className="w-6 h-6 rounded flex items-center justify-center bg-muted mr-2 flex-shrink-0 transition-colors duration-200">
                          <MessageCircle size={14} className="text-[#ED64FC]" />
                        </div>
                        <div className="truncate">
                          <div className="font-medium truncate">
                            {app.app_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                          currentAppId === app.id ? "opacity-100" : ""
                        }`}
                        onClick={(e) => handleDeleteApp(app.id, e)}
                      >
                        {deletingAppId === app.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 transition-transform duration-200 hover:scale-110">
                <AvatarFallback className="bg-[#ED64FC] text-white text-sm">
                  {subscription?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2">
                <p className="text-sm font-medium">
                  {subscription?.email || "User"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
