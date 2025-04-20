// components/workspace/session-selector.tsx
"use client";

import { useState } from "react";
import { Plus, ChevronDown, Check } from "lucide-react";
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

  // Find the current session
  const currentSession = sessions.find(
    (session) => session.id === currentSessionId
  );
  const sessionName = currentSession?.title || "Select Session";

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;

    try {
      await createSession(newSessionName.trim());
      setNewSessionName("");
      setIsCreatingSession(false);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {sessionName}
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        {isLoading ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            Loading sessions...
          </div>
        ) : (
          <>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <DropdownMenuItem
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span>{session.title || "Untitled Session"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(session.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {session.id === currentSessionId && <Check size={16} />}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No sessions found
              </div>
            )}

            <DropdownMenuSeparator />

            {isCreatingSession ? (
              <div className="p-2">
                <div className="flex gap-2">
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
                  />
                  <Button size="sm" onClick={handleCreateSession}>
                    Add
                  </Button>
                </div>
              </div>
            ) : (
              <DropdownMenuItem
                onClick={() => setIsCreatingSession(true)}
                className="flex items-center gap-2"
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
