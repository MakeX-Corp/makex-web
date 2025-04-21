// components/workspace/session-selector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionData } from "@/context/AppContext";
import { formatDistanceToNow } from "date-fns";

interface SessionSelectorProps {
  sessions: SessionData[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string) => void;
  createSession: (title: string) => Promise<SessionData>;
  isLoading: boolean;
}

export function SessionSelector({
  sessions,
  currentSessionId,
  setCurrentSessionId,
  createSession,
  isLoading,
}: SessionSelectorProps) {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
        setCurrentSessionId(existingSession.id);
        setDropdownOpen(false);
      } else {
        // Create a new session
        const newSession = await createSession(newSessionName.trim());
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
    setCurrentSessionId(sessionId);
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
