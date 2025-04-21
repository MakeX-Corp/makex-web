"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  sessionId?: string;
  isProcessing?: boolean;
}

export function ChatInput({
  onSendMessage,
  sessionId,
  isProcessing = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [loadTimestamp, setLoadTimestamp] = useState(new Date().toISOString());

  // Update the timestamp whenever sessionId changes
  useEffect(() => {
    setLoadTimestamp(new Date().toISOString());
    console.log(`Chat component reloaded for session: ${sessionId}`);
  }, [sessionId]);

  const handleSendMessage = () => {
    if (message.trim() && !isProcessing) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-full border rounded-md">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-base font-medium">Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="p-4 border rounded-md bg-muted/30">
            <div className="mb-2">
              <strong>Session ID:</strong> {sessionId || "Not set"}
            </div>
            <div>
              <strong>Component loaded at:</strong> {loadTimestamp}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              This simple version shows when the component reloads. The full
              version will have proper UI and message handling.
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-2 border-t">
        <div className="flex w-full items-end gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] flex-1 resize-none"
            disabled={isProcessing}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={message.trim() === "" || isProcessing}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
