"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SessionListItem,
  updateSessionTitle,
  deleteSession,
  createNewSession,
} from "@/lib/session-service";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, PlusCircle, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionSelectorProps {
  sessions: SessionListItem[];
  currentSessionId: string;
  appId: string;
}

export function SessionSelector({
  sessions: initialSessions,
  currentSessionId,
  appId,
}: SessionSelectorProps) {
  const router = useRouter();
  // Use local state to manage sessions to immediately reflect changes
  const [sessions, setSessions] = useState<SessionListItem[]>(initialSessions);
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local sessions when prop changes
  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTitle]);

  // Get current session title
  const currentSession = sessions.find(
    (session) => session.id === currentSessionId
  );
  const currentTitle = currentSession
    ? currentSession.title || `Session ${currentSession.id.slice(0, 8)}`
    : "Select a session";

  // Handle changing sessions
  const handleSessionChange = (value: string) => {
    window.location.href = `/workspace/${appId}/${value}`;
    setIsOpen(false);
  };

  // Start editing session title
  const handleEditStart = (
    e: React.MouseEvent,
    sessionId: string,
    title: string
  ) => {
    e.stopPropagation();
    setIsEditingTitle(sessionId);
    setNewTitle(title);
  };

  // Cancel editing
  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(null);
  };

  // Save new title
  const handleTitleSave = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (newTitle.trim()) {
      setIsUpdating(true);
      try {
        // Use dedicated updateSessionTitle function
        const success = await updateSessionTitle(sessionId, newTitle);

        if (success) {
          // Update local state to reflect the change immediately
          setSessions((prevSessions) =>
            prevSessions.map((session) =>
              session.id === sessionId
                ? { ...session, title: newTitle }
                : session
            )
          );
        } else {
          console.error("Failed to update session title");
        }
      } catch (error) {
        console.error("Error updating session title:", error);
      } finally {
        setIsUpdating(false);
        setIsEditingTitle(null);
      }
    }
  };

  // Delete session
  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      // Use the deleteSession function from session-service
      const success = await deleteSession(sessionId);

      if (success) {
        // Update local state to remove the deleted session
        setSessions((prevSessions) =>
          prevSessions.filter((session) => session.id !== sessionId)
        );

        if (sessionId === currentSessionId) {
          // If current session is deleted, redirect to a new session
          window.location.href = `/workspace/${appId}/`;
        }
      } else {
        console.error("Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const newSession = await createNewSession(appId);
      if (newSession) {
        window.location.href = `/workspace/${appId}/${newSession.id}`;
      }
    } catch (error) {
      console.error("Error creating new session:", error);
    }
  };

  return (
    <Select
      defaultValue={currentSessionId}
      onValueChange={handleSessionChange}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-[260px] h-9 text-sm bg-background border-input hover:border-primary/80 transition-colors focus:ring-primary/20">
        <SelectValue placeholder="Select a session">{currentTitle}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80 w-[280px] p-1" align="start">
        <SelectGroup>
          <div className="flex items-center justify-between px-2 py-1.5">
            <SelectLabel className="text-xs font-medium text-muted-foreground">
              Sessions
            </SelectLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleCreateNewSession}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              New Session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <div className="px-2 py-3 text-sm text-center text-muted-foreground">
              No sessions found
            </div>
          ) : (
            <div className="py-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "relative group flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors",
                    currentSessionId === session.id && "bg-accent"
                  )}
                  onClick={() =>
                    !isEditingTitle && handleSessionChange(session.id)
                  }
                >
                  {isEditingTitle === session.id ? (
                    // Editing mode
                    <div
                      className="flex items-center justify-between w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        ref={inputRef}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="h-7 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleTitleSave(e as any, session.id);
                          } else if (e.key === "Escape") {
                            handleEditCancel(e as any);
                          }
                        }}
                      />
                      <div className="flex items-center ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleTitleSave(e, session.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={handleEditCancel}
                          disabled={isUpdating}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <span className="truncate flex-1">
                        {session.title || `Session ${session.id.slice(0, 8)}`}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={(e) =>
                            handleEditStart(
                              e,
                              session.id,
                              session.title ||
                                `Session ${session.id.slice(0, 8)}`
                            )
                          }
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(e, session.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </SelectGroup>
        <SelectSeparator className="my-1" />
      </SelectContent>
    </Select>
  );
}
