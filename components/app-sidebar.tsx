"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  CreditCard,
  ChevronRight,
  Search,
  MessageCircle,
  Sun,
  Moon,
  Trash,
  Loader2,
  Plus,
  Edit,
  Check,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useState, useEffect, useRef } from "react";
import { XIcon, DiscordIcon, renderIcon } from "@/utils/image/icon-utils";
import { useTheme } from "next-themes";
import { updateAppName } from "@/lib/app-service";
// Import dialog components for confirmation modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Theme toggle component
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-10 w-10"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { apps, deleteApp, setApps, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredApps, setFilteredApps] = useState(apps);
  const { theme } = useTheme();
  const router = useRouter();
  // State for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingApp, setIsDeletingApp] = useState(false);
  const [appToDelete, setAppToDelete] = useState<null | {
    id: string;
    name: string;
  }>(null);

  // State for editing app names
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editedAppName, setEditedAppName] = useState("");
  const [isUpdatingApp, setIsUpdatingApp] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // External links
  const twitterUrl = "https://x.com/Makexapp";
  const discordUrl = "https://discord.gg/3EsUgb53Zp";

  // Get current app ID from pathname
  const currentAppId = pathname.startsWith("/dashboard/")
    ? pathname.split("/")[2]
    : null;

  // Filter apps when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter((app) =>
        app.app_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  }, [searchQuery, apps]);

  // Focus the input when editing starts
  useEffect(() => {
    if (editingAppId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingAppId]);

  // Handle delete confirmation
  const confirmDelete = (
    e: React.MouseEvent,
    appId: string,
    appName: string
  ) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    setAppToDelete({ id: appId, name: appName });
    setIsDeleteModalOpen(true);
  };

  // Execute the actual deletion
  const handleDeleteApp = async () => {
    if (appToDelete) {
      setIsDeletingApp(true);
      try {
        await deleteApp(appToDelete.id);
        // Check if we're deleting the current app
        if (appToDelete.id === currentAppId) {
          router.push("/dashboard");
        }
        setIsDeleteModalOpen(false);
        setAppToDelete(null);
      } catch (error) {
        console.error("Failed to delete app:", error);
        // Handle error (e.g., show toast notification)
      } finally {
        setIsDeletingApp(false);
      }
    }
  };

  // Start editing app name
  const startEditing = (
    e: React.MouseEvent,
    appId: string,
    currentName: string
  ) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    setEditingAppId(appId);
    setEditedAppName(currentName);
  };

  // Cancel editing
  const cancelEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAppId(null);
  };

  // Save app name
  const saveAppName = async (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (editedAppName.trim() === "") return;

    setIsUpdatingApp(true);
    try {
      await updateAppName(appId, editedAppName.trim());

      setApps((prevApps) =>
        prevApps.map((app) =>
          app.id === appId
            ? { ...app, display_name: editedAppName.trim() }
            : app
        )
      );

      setEditingAppId(null);
    } catch (error) {
      console.error("Failed to update app name:", error);
      // Handle error (e.g., show toast notification)
    } finally {
      setIsUpdatingApp(false);
    }
  };

  // Navigation items - properly typed
  const navItems = [
    {
      href: twitterUrl,
      label: "X",
      icon: XIcon,
      external: true,
    },
    {
      href: discordUrl,
      label: "Discord",
      icon: DiscordIcon,
      external: true,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
      external: false,
    },
    {
      href: "/dashboard/pricing",
      label: "Upgrade Plan",
      icon: CreditCard,
      external: false,
    },
  ];

  return (
    <>
      <div
        className={cn(
          "flex flex-col h-full border-r bg-background transition-all duration-300",
          expanded ? "w-64" : "w-16"
        )}
      >
        {/* Top header with logo and toggle button */}
        <div className="p-4 flex items-center justify-between">
          {expanded && (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="relative w-6 h-6 flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="MakeX logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="font-semibold text-sm tracking-tight">
                  MakeX
                </span>
              </Link>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className={cn("h-6 w-6", expanded ? "" : "ml-auto")}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                expanded ? "rotate-180" : ""
              )}
            />
          </Button>
        </div>

        {/* Apps section - Now takes up remaining space before bottom nav */}
        <div className="px-3 py-3 flex flex-col flex-1 overflow-hidden">
          {expanded ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Apps
                </h2>
                {/* Add New Plus Button */}
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-sm hover:bg-muted"
                    title="Create new app"
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </Link>
              </div>

              {/* Search bar */}
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-1.5 pl-8 pr-2 text-sm rounded-md border bg-background"
                />
              </div>

              {/* Enhanced Apps list with edit and delete functionality */}
              <div className="space-y-1 overflow-y-auto flex-1">
                {isLoading ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredApps.length > 0 ? (
                  filteredApps.map((app) => (
                    <div key={app.id} className="group relative">
                      {editingAppId === app.id ? (
                        // Editing mode
                        <div className="flex items-center p-1.5 rounded-md bg-muted/50">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editedAppName}
                            onChange={(e) => setEditedAppName(e.target.value)}
                            className="flex-1 text-sm py-0.5 px-1.5 rounded bg-background border focus:outline-none focus:ring-1 focus:ring-primary"
                            disabled={isUpdatingApp}
                          />
                          <div className="flex ml-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-primary"
                              onClick={(e) => saveAppName(e, app.id)}
                              disabled={isUpdatingApp}
                            >
                              {isUpdatingApp ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground"
                              onClick={cancelEditing}
                              disabled={isUpdatingApp}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Normal view mode
                        <>
                          <Link
                            href={`/dashboard/${app.id}`}
                            className={cn(
                              "flex items-center py-1.5 px-2 text-sm rounded-md transition-colors font-medium w-full pr-12",
                              pathname.includes(`/dashboard/${app.id}`)
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <span className="truncate">
                              {app.display_name || app.app_name}
                            </span>
                          </Link>
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Edit button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) =>
                                startEditing(
                                  e,
                                  app.id,
                                  app.display_name ||
                                    app.app_name ||
                                    "Untitled App"
                                )
                              }
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                            </Button>
                            {/* Delete button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) =>
                                confirmDelete(
                                  e,
                                  app.id,
                                  app.display_name || app.app_name
                                )
                              }
                            >
                              <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground py-2 px-2 italic">
                    {searchQuery.trim() !== ""
                      ? "No matching apps"
                      : "No apps yet. Click the + button to create one."}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <div className={expanded ? "px-3 py-2" : "flex justify-center py-2"}>
          {expanded ? (
            <div className="flex items-center">
              <ThemeToggle />
              <span className="ml-3 text-sm font-medium">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
          ) : (
            <ThemeToggle />
          )}
        </div>

        {/* Navigation - moved to bottom */}
        <div className="py-4 mt-2 border-t border-muted/40">
          <div className={expanded ? "px-3 pb-2" : "px-0 pb-2"}>
            <h2
              className={cn(
                "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                !expanded && "sr-only"
              )}
            >
              Links
            </h2>
          </div>
          <nav className="space-y-1 px-2">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center h-10 px-3 rounded-md text-sm transition-colors font-medium",
                    "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !expanded && "justify-center"
                  )}
                >
                  {renderIcon(item.icon)}
                  {expanded && <span className="ml-3">{item.label}</span>}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center h-10 px-3 rounded-md text-sm transition-colors font-medium",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !expanded && "justify-center"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {expanded && <span className="ml-3">{item.label}</span>}
                </Link>
              )
            )}
          </nav>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete App</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{appToDelete?.name}"? This action
              cannot be undone and all associated data will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteApp} disabled={isDeletingApp}>
              {isDeletingApp ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
