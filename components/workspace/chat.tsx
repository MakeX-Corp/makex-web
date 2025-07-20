"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useSession } from "@/context/session-context";
import { useApp } from "@/context/AppContext";
import { useState } from "react";

interface ChatProps {
  sessionId: string;
  onResponseComplete: () => void;
  onSessionError?: (error: string) => void;
  containerState: string;
}

export function Chat({
  sessionId,
  onResponseComplete,
  onSessionError,
  containerState,
}: ChatProps) {
  const { appId, apiUrl, appName, supabaseProject } = useSession();
  const { subscription, isAIResponding, setIsAIResponding } = useApp();
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    id: sessionId,
    transport: new DefaultChatTransport({
      api: "/api/chat/",
    }),
    onFinish: (result) => {
      console.log("Chat onFinish called:", result.message);
      setIsAIResponding(false);
      onResponseComplete();
    },
    onError: (error) => {
      console.error("Chat onError called:", error);
      setIsAIResponding(false);
    },
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (containerState !== "active") {
      alert("Please refresh the page and try again, your app was paused");
      return;
    }

    if (!input.trim()) {
      return;
    }

    setIsAIResponding(true);
    sendMessage(
      { text: input },
      {
        body: {
          apiUrl,
          appId,
          appName,
          sessionId,
          supabase_project: supabaseProject,
          subscription,
        },
      }
    );
    setInput("");
  };

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              No messages yet. Start a conversation!
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <Card
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                }`}
              >
                <CardContent className="p-4">
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.parts.map((part, index) => {
                      switch (part.type) {
                        case "text":
                          return <div key={`${message.id}-${index}`}>{part.text}</div>;
                        default:
                          return null;
                      }
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4 bg-background">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 py-2 px-3 rounded-md border focus-visible:outline-none bg-background"
            disabled={status !== "ready"}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || status !== "ready"}
          >
            {status === "streaming" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            An error occurred. Please try again.
            <div className="text-xs mt-1">Error: {error.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
