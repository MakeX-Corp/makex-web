import { Card, CardContent } from "@/components/ui/card";

export function AppEditorSkeleton() {
  return (
    <>
      {/* Sessions Sidebar Skeleton */}
      <div className="w-64 h-screen border-r bg-background">
        <div className="p-4 space-y-4">
          {/* Simulate chat session items */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-md animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Skeleton */}
        <div className="p-4 bg-white border-b">
          <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse" />
        </div>

        {/* Main Content Area Skeleton */}
        <div className="flex-1 p-4 gap-4 flex overflow-hidden">
          {/* Chat Window Skeleton */}
          <Card className="flex-1">
            <CardContent className="p-4 h-full">
              <div className="h-full bg-gray-200 rounded-md animate-pulse" />
            </CardContent>
          </Card>

          {/* Preview Section Skeleton */}
          <Card className="w-1/2 bg-zinc-50">
            <CardContent className="relative h-full flex flex-col p-4">
              <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse mb-4" />
              <div className="flex-1 bg-gray-200 rounded-md animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 