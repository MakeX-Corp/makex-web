import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AppEditorSkeleton() {
  return (
    <>
      {/* Sessions Sidebar Skeleton */}
      <div className="w-64 h-screen border-r border-border bg-background">
        <div className="p-4 space-y-4">
          {/* Simulate chat session items */}
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Skeleton */}
        <div className="p-4 bg-background border-b border-border">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Main Content Area Skeleton */}
        <div className="flex-1 p-4 gap-4 flex overflow-hidden">
          {/* Chat Window Skeleton */}
          <Card className="flex-1">
            <CardContent className="p-4 h-full">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>

          {/* Preview Section Skeleton */}
          <Card className="w-1/2 bg-card">
            <CardContent className="relative h-full flex flex-col p-4">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="flex-1 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 