import { Plus, ChevronDown, Check, X, Loader2, Trash, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { useSession } from "@/context/session-context";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";

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
    getCurrentSessionTitle,
  } = useSession();
  const { isAIResponding } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const isLoading = loadingSessions || loadingCurrentSession;

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
    if (isAIResponding) return;
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
      const success = await updateSessionTitle(sessionId, editSessionName.trim());

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
  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
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

  // Get the current session title from the sessions array
  const currentTitle = getCurrentSessionTitle();

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[180px] justify-between"
          disabled={isLoading || isAIResponding}
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </span>
          ) : (
            currentTitle
          )}
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 p-2">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
            <p>Loading sessions...</p>
          </div>
        ) : (
          <>
            {sessions.length > 0 ? (
              <>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {sessions.map((session) => (
                    <div key={session.id}>
                      {editingSessionId === session.id ? (
                        <div className="p-1.5 rounded-md bg-muted/50">
                          <div className="flex gap-2">
                            <Input
                              ref={editInputRef}
                              placeholder="Session name"
                              value={editSessionName}
                              onChange={(e) => setEditSessionName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEditSession(session.id);
                                if (e.key === "Escape") {
                                  setEditingSessionId(null);
                                  setEditSessionName("");
                                }
                              }}
                              autoFocus
                              className="flex-1 text-sm py-0.5 px-1.5 rounded bg-background border focus:outline-none focus:ring-1 focus:ring-primary"
                              disabled={isSubmitting}
                            />
                            <div className="flex ml-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary"
                                onClick={() => handleEditSession(session.id)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground"
                                onClick={() => {
                                  setEditingSessionId(null);
                                  setEditSessionName("");
                                }}
                                disabled={isSubmitting}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          <div
                            onClick={() => handleSessionSelection(session.id)}
                            className={cn(
                              "flex items-center py-1.5 px-2 text-sm rounded-md transition-colors font-medium w-full pr-12 cursor-pointer",
                              session.id === currentSessionId
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            {/* Always use the title from the sessions array */}
                            <span className="truncate">{session.title || "Untitled Session"}</span>
                          </div>
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Edit button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => startEditSession(session, e)}
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                            </Button>
                            {/* Delete button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">No sessions found</div>
            )}

            <DropdownMenuSeparator className="my-2" />

            <div
              onClick={() => handleCreateSession()}
              className="flex items-center gap-2 py-1.5 px-2 text-sm rounded-md transition-colors cursor-pointer hover:bg-muted"
            >
              <Plus size={16} />
              <span>New Session</span>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
