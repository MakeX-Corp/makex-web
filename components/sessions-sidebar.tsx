import { Plus, MessageSquare, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  title: string;
  created_at: string;
}

interface SessionsSidebarProps {
  appId: string;
  authToken: string;
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  loading: boolean;
  onCreateSession: () => Promise<void>;
  currentSessionId: string | null;
  setCurrentSessionId: (sessionId: string | null) => void;
  isCreatingSession?: boolean; // New prop to indicate session creation status
}

export function SessionsSidebar({
  appId,
  authToken,
  sessions,
  setSessions,
  loading,
  onCreateSession,
  currentSessionId,
  setCurrentSessionId,
  isCreatingSession = false, // Default to false if not provided
}: SessionsSidebarProps) {
  const router = useRouter();

  const handleSessionClick = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    router.push(`/ai-editor/${appId}?session=${sessionId}`);
  };

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent triggering the session click
    try {
      const response = await fetch(`/api/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        // Remove the deleted session from the list
        setSessions(sessions.filter((session) => session.id !== sessionId));

        // If the deleted session was the current one, clear the current session
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          router.push(`/ai-editor/${appId}`);
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/dashboard")}
                  className="h-8 w-8 p-0 hover:bg-transparent"
                  aria-label="Back to home"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              <span>Chat Sessions</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateSession}
                disabled={isCreatingSession}
                className="h-8 w-8 p-0 relative"
              >
                {isCreatingSession ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading ? (
                  <>
                    <div className="px-4 py-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="px-4 py-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="px-4 py-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </>
                ) : !sessions || sessions.length === 0 ? (
                  <div
                    key="empty"
                    className="px-4 py-2 text-sm text-muted-foreground"
                  >
                    No sessions yet
                  </div>
                ) : (
                  sessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton
                        onClick={() => handleSessionClick(session.id)}
                        className={`flex items-center justify-between group ${
                          session.id === currentSessionId
                            ? "bg-primary/40 hover:bg-primary/15"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">
                            {session.title || "New Chat"}
                          </span>
                        </div>
                        <div
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:text-destructive"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
