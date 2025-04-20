"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Settings,
  User,
  Home,
  Plus,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = React.useState(false);

  // Navigation items
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r bg-background transition-all duration-300",
        expanded ? "w-64" : "w-16"
      )}
    >
      {/* Toggle button - kept in same place */}
      <div className="p-4 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className="h-6 w-6"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              expanded ? "rotate-180" : ""
            )}
          />
        </Button>
      </div>

      {/* New button - moved to top */}
      <div className="p-4">
        <Button
          className={cn("w-full gap-2", !expanded && "justify-center px-0")}
        >
          <Plus size={16} />
          {expanded && <span>New App</span>}
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Navigation - moved to bottom */}
      <div className="py-4">
        <nav className="space-y-2 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-10 px-3 rounded-md text-sm transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
                !expanded && "justify-center"
              )}
            >
              <item.icon size={20} />
              {expanded && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
