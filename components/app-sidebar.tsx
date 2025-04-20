"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Settings,
  User,
  ChevronRight,
  Search,
  MessageCircle,
  Sun,
  Moon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useState, useEffect } from "react";
import { XIcon, DiscordIcon, renderIcon } from "@/utils/image/icon-utils";
import { useTheme } from "next-themes";

export function AppSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { subscription, apps } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredApps, setFilteredApps] = useState(apps);

  // Check if user is signed in based on subscription data
  const isSignedIn = !!subscription;

  // External links
  const twitterUrl = "https://x.com/Makexapp";
  const discordUrl = "https://discord.gg/3EsUgb53Zp";

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
    { href: "/settings", label: "Settings", icon: Settings, external: false },
    {
      href: isSignedIn ? "/profile" : "/signin",
      label: isSignedIn ? "Profile" : "Sign In",
      icon: User,
      external: false,
    },
  ];

  return (
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
            <div className="relative w-6 h-6 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="MakeX logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-sm tracking-tight">MakeX</span>
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

      {/* Apps section */}
      <div className="px-3 py-3">
        {expanded ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Apps
              </h2>
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

            {/* Apps list */}
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/workspace/${app.id}`}
                    className={cn(
                      "flex items-center py-1.5 px-2 text-sm rounded-md transition-colors font-medium",
                      pathname.includes(`/dashboard/app/${app.id}`)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="truncate">
                      {app.app_name || "Untitled App"}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-muted-foreground py-2 px-2 italic">
                  {apps.length === 0 ? "No apps found" : "No matching apps"}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

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
  );
}
