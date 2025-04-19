"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Settings,
  Sun,
  Moon,
  X,
  CreditCard,
  HelpCircle,
  MoreHorizontal,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/context/AppContext";

export default function Sidebar() {
  const {
    darkMode,
    toggleDarkMode,
    sidebarVisible,
    toggleSidebar,
    apps,
    setApps,
    currentAppId,
    isLoading,
    subscription,
  } = useApp();

  const pathname = usePathname();
  const router = useRouter();

  // Local state
  const [activeTab, setActiveTab] = useState("apps");
  const [appSearchTerm, setAppSearchTerm] = useState("");

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
  const handleDeleteApp = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setApps(apps.filter((app) => app.id !== appId));
    if (currentAppId === appId) {
      router.push("/dashboard");
    }
  };

  // Define sidebar tabs with routes
  const sidebarTabs = [
    {
      id: "apps",
      label: "Create",
      icon: <Plus size={18} />,
      path: "/dashboard",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      path: "/dashboard/settings",
    },
    {
      id: "help",
      label: "Help & Support",
      icon: <HelpCircle size={18} />,
      path: "/dashboard/help",
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
        <div
          className={`w-10 h-10 rounded-md flex items-center justify-center ${
            darkMode ? "bg-[#ED64FC]" : "bg-[#ED64FC]"
          } text-white font-bold text-xl shadow-md transition-all duration-300 hover:scale-105 active:scale-95`}
        >
          <Image src="/logo.png" alt="MakeX Logo" width={24} height={24} />
        </div>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col ${
          darkMode ? "bg-gray-900 text-white" : "bg-[#FDFAFF] text-gray-800"
        } border-r ${
          darkMode ? "border-gray-700" : "border-[#F5E1FC]"
        } shadow-lg transition-transform duration-300 ease-in-out ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex justify-between items-center border-b border-[#F5E1FC] dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center ${
                darkMode ? "bg-[#ED64FC]" : "bg-[#ED64FC]"
              } text-white transition-colors duration-300`}
            >
              <Image src="/logo.png" alt="MakeX Logo" width={20} height={20} />
            </div>
            <span className="font-semibold text-lg">MakeX</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="transition-all duration-200 hover:rotate-90"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Sidebar Tabs */}
        <div className="p-2">
          <nav className="space-y-1">
            {sidebarTabs.map((tab) => (
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
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        <div className="flex-1 overflow-hidden">
          {(activeTab === "apps" ||
            pathname === "/dashboard" ||
            pathname.startsWith("/dashboard/app/")) && (
            <div className="flex flex-col h-full">
              {/* App Search */}
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
                <h3 className="px-3 text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
                  My Apps
                </h3>

                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Loading apps...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredApps.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {appSearchTerm
                          ? "No apps found"
                          : "No apps created yet"}
                      </div>
                    )}

                    {filteredApps.map((app) => (
                      <div
                        key={app.id}
                        className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer group transition-all duration-200 ${
                          currentAppId === app.id
                            ? darkMode
                              ? "bg-gray-800"
                              : "bg-[#F5E1FC]"
                            : "hover:bg-[#FCF6FF] dark:hover:bg-gray-800"
                        }`}
                        onClick={() => handleAppClick(app.id)}
                      >
                        <div className="flex items-center overflow-hidden">
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center ${
                              darkMode ? "bg-gray-700" : "bg-[#FCF6FF]"
                            } mr-2 flex-shrink-0 transition-colors duration-200`}
                          >
                            <MessageCircle
                              size={14}
                              className={
                                darkMode ? "text-[#ED64FC]" : "text-[#ED64FC]"
                              }
                            />
                          </div>
                          <div className="truncate">
                            <div className="font-medium truncate">
                              {app.app_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-4">
              <h3 className="font-medium mb-4">Subscription</h3>
              {isLoading ? (
                <div className="text-sm">Loading subscription info...</div>
              ) : subscription ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-[#F5E1FC] dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">
                        {subscription.hasActiveSubscription
                          ? "Active Plan"
                          : "No Active Plan"}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          subscription.hasActiveSubscription
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                        }`}
                      >
                        {subscription.subscription?.status || "inactive"}
                      </div>
                    </div>

                    {subscription.hasActiveSubscription && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {subscription.pendingCancellation
                            ? "Your subscription will end on"
                            : "Next billing date"}
                          :
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {new Date(
                              subscription.expiresAt || ""
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        {subscription.pendingCancellation && (
                          <div className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 p-2 rounded-md">
                            Your subscription will not renew automatically
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => router.push("/dashboard/billing/manage")}
                  >
                    <span>
                      {subscription.hasActiveSubscription
                        ? "Manage Subscription"
                        : "Upgrade Plan"}
                    </span>
                    <CreditCard size={16} />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-[#FCF6FF] dark:bg-gray-800">
                    <div className="font-semibold mb-2">No Subscription</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      You don't have an active subscription yet.
                    </div>
                  </div>

                  <Button
                    variant="default"
                    className="w-full justify-between"
                    onClick={() => router.push("/dashboard/billing/plans")}
                  >
                    <span>Upgrade to Pro</span>
                    <CreditCard size={16} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 transition-transform duration-200 hover:scale-110">
                <AvatarFallback className="bg-[#ED64FC] text-white text-sm">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="ml-2">
                <p className="text-sm font-medium">User Name</p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={16} />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
