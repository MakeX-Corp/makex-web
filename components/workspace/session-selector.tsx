import {
  Plus,
  ChevronDown,
  Check,
  X,
  Loader2,
  Trash,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "@/context/session-context";
import { Button } from "../ui/button";

export function SessionSelector() {
  const {
    sessions,
    currentSessionId,
    switchSession,
    createSession,
    deleteSession,
    updateSessionTitle,
    loadingSessions,
    loadingCurrentSession,
  } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const isLoading = loadingSessions || loadingCurrentSession;

  // Find the current session
  const currentSession = sessions.find(
    (session) => session.id === currentSessionId
  );
  const sessionName = currentSession?.title || "Select Session";

  // Handle creating a new session
  const handleCreateSession = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setDropdownOpen(false);
      // Create a new session
      const newSession = await createSession();
      if (newSession) {
        console.log(`New session created: ${newSession.id}`);
        // Close dropdown after successful creation
        setDropdownOpen(false);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle session selection
  const handleSessionSelection = (sessionId: string) => {
    if (sessionId === currentSessionId) {
      setDropdownOpen(false);
      return;
    }

    console.log(`Setting current session: ${sessionId}`);
    switchSession(sessionId);
    setDropdownOpen(false);
  };

  // Handle editing session
  const handleEditSession = async (sessionId: string) => {
    if (!editSessionName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log(`Updating session ${sessionId} to name: ${editSessionName}`);

      // Call the updateSessionTitle function from context
      const success = await updateSessionTitle(
        sessionId,
        editSessionName.trim()
      );

      if (!success) {
        console.error("Failed to update session title");
      }

      // Reset editing state
      setEditingSessionId(null);
      setEditSessionName("");
    } catch (error) {
      console.error("Failed to update session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting session
  const handleDeleteSession = async (
    sessionId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (isDeleting) return;
    if (sessions.length <= 1) return;
    try {
      setIsDeleting(true);
      console.log(`Deleting session: ${sessionId}`);

      // Call the deleteSession function from context
      const success = await deleteSession(sessionId);

      if (!success) {
        console.error("Failed to delete session");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditSession = (session: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingSessionId(session.id);
    setEditSessionName(session.title || "");
  };

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[180px] justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </span>
          ) : (
            sessionName
          )}
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
            <p>Loading sessions...</p>
          </div>
        ) : (
          <>
            {sessions.length > 0 ? (
              <>
                <div className="max-h-72 overflow-y-auto">
                  {sessions.map((session) => (
                    <div key={session.id}>
                      {editingSessionId === session.id ? (
                        <div className="p-2" ref={editInputRef}>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Session name"
                              value={editSessionName}
                              onChange={(e) =>
                                setEditSessionName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleEditSession(session.id);
                                if (e.key === "Escape") {
                                  setEditingSessionId(null);
                                  setEditSessionName("");
                                }
                              }}
                              autoFocus
                              className="flex-1"
                              disabled={isSubmitting}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSession(session.id)}
                              disabled={isSubmitting || !editSessionName.trim()}
                              className="px-2 h-9 flex-shrink-0"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check size={16} />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSessionId(null);
                                setEditSessionName("");
                              }}
                              className="p-0 h-9 w-9 flex-shrink-0"
                              disabled={isSubmitting}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleSessionSelection(session.id)}
                          className="flex items-center justify-between cursor-pointer py-2 group"
                        >
                          <div className="flex flex-col truncate mr-2">
                            <span className="font-medium truncate">
                              {session.title || "Untitled Session"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(session.created_at),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mr-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => startEditSession(session, e)}
                              >
                                <Edit
                                  size={14}
                                  className="text-muted-foreground hover:text-foreground"
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) =>
                                  handleDeleteSession(session.id, e)
                                }
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash
                                    size={14}
                                    className="text-muted-foreground hover:text-destructive"
                                  />
                                )}
                              </Button>
                            </div>
                            {session.id === currentSessionId && (
                              <Check
                                size={16}
                                className="text-primary flex-shrink-0"
                              />
                            )}
                          </div>
                        </DropdownMenuItem>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No sessions found
              </div>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => handleCreateSession()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>New Session</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
