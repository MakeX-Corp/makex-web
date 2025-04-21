"use client";

import { SessionListItem } from "@/lib/session-service";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SessionSelectorProps {
  sessions: SessionListItem[];
  currentSessionId: string;
  appId: string;
}

export function SessionSelector({
  sessions,
  currentSessionId,
  appId,
}: SessionSelectorProps) {
  return (
    <Select
      defaultValue={currentSessionId}
      onValueChange={(value) => {
        // Navigate to the selected session
        window.location.href = `/workspace/${appId}/${value}`;
      }}
    >
      <SelectTrigger className="w-[230px] h-9 text-sm bg-background border-muted-foreground/20">
        <SelectValue placeholder="Select a session" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectGroup>
          <SelectLabel className="text-muted-foreground">
            Available Sessions
          </SelectLabel>
          {sessions.length === 0 ? (
            <div className="px-2 py-1 text-sm text-muted-foreground">
              No sessions found
            </div>
          ) : (
            sessions.map((session) => (
              <SelectItem
                key={session.id}
                value={session.id}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  <span>
                    {session.title || `Session ${session.id.slice(0, 8)}`}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectGroup>
        <SelectSeparator />
      </SelectContent>
    </Select>
  );
}
