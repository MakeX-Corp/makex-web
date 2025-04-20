import {
  Plus,
  MessageSquare,
  ArrowLeft,
  Trash2,
  Loader2,
  Edit,
  Check,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

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
  isCreatingSession?: boolean;
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
  isCreatingSession = false,
}: SessionsSidebarProps) {
  const router = useRouter();
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null
  );
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const handleSessionClick = (sessionId: string) => {
    // Don't navigate if we're editing
    if (editingSessionId !== null) return;

    setCurrentSessionId(sessionId);
    router.push(`/dashboard/app/${appId}?session=${sessionId}`);
  };

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent triggering the session click

    // Set the deleting session ID
    setDeletingSessionId(sessionId);

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
    } finally {
      // Clear the deleting session ID
      setDeletingSessionId(null);
    }
  };

  const handleEditSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the session click
    setEditingSessionId(sessionId);
    setEditedTitles({
      ...editedTitles,
      [sessionId]:
        sessions.find((s) => s.id === sessionId)?.title || "New Chat",
    });
  };

  const handleSaveTitle = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const newTitle = editedTitles[sessionId];
    const currentTitle =
      sessions.find((s) => s.id === sessionId)?.title || "New Chat";

    // Don't update if title hasn't changed
    if (newTitle === currentTitle) {
      setEditingSessionId(null);
      return;
    }

    setIsLoading({ ...isLoading, [sessionId]: true });
    try {
      const response = await fetch(`/api/sessions/title`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId,
          title: newTitle,
        }),
      });

      if (response.ok) {
        // Update the session title in the list
        handleTitleUpdate(sessionId, newTitle);
      } else {
        console.error("Failed to update session title");
      }
    } catch (error) {
      console.error("Error updating session title:", error);
    } finally {
      setIsLoading({ ...isLoading, [sessionId]: false });
      setEditingSessionId(null);
    }
  };

  const handleCancelEdit = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  // Handler for input change
  const handleTitleInputChange = (sessionId: string, value: string) => {
    setEditedTitles({
      ...editedTitles,
      [sessionId]: value,
    });
  };

  // Add handler for updating session title
  const handleTitleUpdate = (sessionId: string, newTitle: string) => {
    setSessions(
      sessions.map((session) =>
        session.id === sessionId ? { ...session, title: newTitle } : session
      )
    );
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
                      <div
                        className={`flex items-center justify-between group p-2 w-full gap-2 overflow-hidden rounded-md text-left text-sm hover:bg-accent/50 cursor-pointer ${
                          session.id === currentSessionId
                            ? "bg-primary/40 hover:bg-primary/15"
                            : ""
                        }`}
                        onClick={() => handleSessionClick(session.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSessionClick(session.id)
                        }
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          {editingSessionId === session.id ? (
                            <Input
                              type="text"
                              value={editedTitles[session.id] || ""}
                              onChange={(e) =>
                                handleTitleInputChange(
                                  session.id,
                                  e.target.value
                                )
                              }
                              className="h-7 text-sm py-1"
                              disabled={isLoading[session.id]}
                              onClick={(e) => e.stopPropagation()} // Prevent session click
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === "Enter") {
                                  handleSaveTitle(
                                    session.id,
                                    e as any as React.MouseEvent
                                  );
                                } else if (e.key === "Escape") {
                                  handleCancelEdit(
                                    session.id,
                                    e as any as React.MouseEvent
                                  );
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`truncate flex-1 ${
                                session.id === currentSessionId
                                  ? "font-medium"
                                  : ""
                              }`}
                            >
                              {session.title || "New Chat"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          {editingSessionId === session.id ? (
                            // Show only save and cancel buttons when editing
                            <div className="flex items-center">
                              <div
                                className="h-6 w-6 p-0 flex items-center justify-center cursor-pointer hover:text-green-500 flex-shrink-0 mr-1"
                                onClick={(e) => handleSaveTitle(session.id, e)}
                                role="button"
                                tabIndex={0}
                                aria-label="Save session title"
                              >
                                {isLoading[session.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <Check className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div
                                className="h-6 w-6 p-0 flex items-center justify-center cursor-pointer hover:text-destructive flex-shrink-0"
                                onClick={(e) => handleCancelEdit(session.id, e)}
                                role="button"
                                tabIndex={0}
                                aria-label="Cancel editing"
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          ) : (
                            // Show edit and delete buttons when not editing
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div
                                className="h-6 w-6 p-0 flex items-center justify-center cursor-pointer hover:text-blue-500 flex-shrink-0 mr-1"
                                onClick={(e) =>
                                  handleEditSession(session.id, e)
                                }
                                role="button"
                                tabIndex={0}
                                aria-label="Edit session title"
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div
                                className="h-6 w-6 p-0 flex items-center justify-center cursor-pointer hover:text-destructive flex-shrink-0"
                                onClick={(e) =>
                                  handleDeleteSession(session.id, e)
                                }
                                role="button"
                                tabIndex={0}
                                aria-label="Delete session"
                              >
                                {deletingSessionId === session.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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
