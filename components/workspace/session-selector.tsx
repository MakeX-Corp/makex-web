/*

import { Plus, ChevronDown, Check, X, Loader2 } from "lucide-react";
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
    loadingSessions,
    loadingCurrentSession,
  } = useSession();

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = loadingSessions || loadingCurrentSession;

  // Find the current session
  const currentSession = sessions.find(
    (session) => session.id === currentSessionId
  );
  const sessionName = currentSession?.title || "Select Session";

  // Handle outside clicks to cancel new session creation
  useEffect(() => {
    if (!isCreatingSession) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsCreatingSession(false);
        setNewSessionName("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreatingSession]);

  // Handle creating a new session
  const handleCreateSession = async () => {
    if (!newSessionName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log(`Creating new session: ${newSessionName}`);

      // Check for existing session with the same name first
      const existingSession = sessions.find(
        (session) => session.title === newSessionName.trim()
      );

      if (existingSession) {
        console.log(
          `Session with name "${newSessionName}" already exists, using existing session`
        );
        switchSession(existingSession.id);
        setDropdownOpen(false);
      } else {
        // Create a new session
        const newSession = await createSession();
        if (newSession) {
          console.log(`New session created: ${newSession.id}`);
          // Close dropdown after successful creation
          setDropdownOpen(false);
        }
      }

      // Reset the form
      setNewSessionName("");
      setIsCreatingSession(false);
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
                    <DropdownMenuItem
                      key={session.id}
                      onClick={() => handleSessionSelection(session.id)}
                      className="flex items-center justify-between cursor-pointer py-2"
                    >
                      <div className="flex flex-col truncate mr-2">
                        <span className="font-medium truncate">
                          {session.title || "Untitled Session"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {session.id === currentSessionId && (
                        <Check
                          size={16}
                          className="text-primary flex-shrink-0"
                        />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No sessions found
              </div>
            )}

            <DropdownMenuSeparator />

            {isCreatingSession ? (
              <div className="p-2">
                <div className="flex gap-2" ref={inputRef}>
                  <Input
                    placeholder="Session name"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateSession();
                      if (e.key === "Escape") {
                        setIsCreatingSession(false);
                        setNewSessionName("");
                      }
                    }}
                    autoFocus
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateSession}
                    disabled={isSubmitting || !newSessionName.trim()}
                    className="px-2 h-9 flex-shrink-0"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingSession(false);
                      setNewSessionName("");
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
                onClick={() => setIsCreatingSession(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>New Session</span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
*/
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
    loadingSessions,
    loadingCurrentSession,
  } = useSession();

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const isLoading = loadingSessions || loadingCurrentSession;

  // Find the current session
  const currentSession = sessions.find(
    (session) => session.id === currentSessionId
  );
  const sessionName = currentSession?.title || "Select Session";

  // Handle outside clicks to cancel new session creation
  useEffect(() => {
    if (!isCreatingSession && !editingSessionId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        (isCreatingSession &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)) ||
        (editingSessionId &&
          editInputRef.current &&
          !editInputRef.current.contains(event.target as Node))
      ) {
        setIsCreatingSession(false);
        setNewSessionName("");
        setEditingSessionId(null);
        setEditSessionName("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreatingSession, editingSessionId]);

  // Handle creating a new session
  const handleCreateSession = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const sessionTitle = newSessionName.trim() || "Untitled Session";
      console.log(`Creating new session: ${sessionTitle}`);

      // Check for existing session with the same name first
      const existingSession = sessions.find(
        (session) => session.title === sessionTitle
      );

      if (existingSession) {
        console.log(
          `Session with name "${sessionTitle}" already exists, using existing session`
        );
        switchSession(existingSession.id);
        setDropdownOpen(false);
      } else {
        // Create a new session
        const newSession = await createSession();
        if (newSession) {
          console.log(`New session created: ${newSession.id}`);
          // Close dropdown after successful creation
          setDropdownOpen(false);
        }
      }

      // Reset the form
      setNewSessionName("");
      setIsCreatingSession(false);
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
      // Implementation would depend on your API
      console.log(`Updating session ${sessionId} to name: ${editSessionName}`);

      // Mock implementation - in real app, you'd call an API
      // await updateSession(sessionId, { title: editSessionName.trim() });

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
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      // Implementation would depend on your API
      console.log(`Deleting session: ${sessionId}`);

      // Mock implementation - in real app, you'd call an API
      // await deleteSession(sessionId);

      // If we're deleting the current session, switch to another one
      if (sessionId === currentSessionId && sessions.length > 1) {
        const nextSession = sessions.find(
          (session) => session.id !== sessionId
        );
        if (nextSession) {
          switchSession(nextSession.id);
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setIsSubmitting(false);
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
                                <Trash
                                  size={14}
                                  className="text-muted-foreground hover:text-destructive"
                                />
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

            {isCreatingSession ? (
              <div className="p-2">
                <div className="flex gap-2" ref={inputRef}>
                  <Input
                    placeholder="Session name (optional)"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateSession();
                      if (e.key === "Escape") {
                        setIsCreatingSession(false);
                        setNewSessionName("");
                      }
                    }}
                    autoFocus
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateSession}
                    disabled={isSubmitting}
                    className="px-2 h-9 flex-shrink-0"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingSession(false);
                      setNewSessionName("");
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
                onClick={() => setIsCreatingSession(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>New Session</span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
