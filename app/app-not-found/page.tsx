"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.top?.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6 bg-card p-8 rounded-lg shadow-lg border border-border">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <RefreshCw className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">App Server Closed</h1>

        <p className="text-muted-foreground">
          The app server has been closed due to inactivity. Please refresh the page to reconnect.
        </p>

        <Button onClick={handleRefresh} className="w-full" disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
