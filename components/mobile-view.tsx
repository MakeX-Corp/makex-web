"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LaptopIcon } from "lucide-react";

export function MobileView() {
  const [appName, setAppName] = useState("AI Editor");

  // Extract app name from URL if possible
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/ai-editor\/([^\/\?]+)/);
    if (match && match[1]) {
      // Try to make the ID more readable by replacing dashes with spaces
      const readableId = match[1].replace(/-/g, " ");
      setAppName(readableId);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full p-6 flex flex-col items-center text-center space-y-6">
          <LaptopIcon className="h-16 w-16 text-primary mb-2" />

          <h1 className="text-2xl font-bold text-foreground">Mobile View Not Available</h1>

          <p className="text-muted-foreground mb-4">
            The AI Editor for <span className="font-semibold text-foreground">{appName}</span>{" "}
            requires a larger screen for the best experience.
          </p>

          <p className="text-sm text-muted-foreground">
            Please switch to a desktop or tablet device to access all features and continue editing
            your application.
          </p>
        </Card>
      </div>
    </div>
  );
}
