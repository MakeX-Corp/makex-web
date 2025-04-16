"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

export function Header() {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push("/profile/settings");
  };

  return (
    <header className="border-b bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={handleProfileClick}
            className="h-9 gap-2 px-3"
          >
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Profile</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
