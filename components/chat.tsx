"use client";

import { useChat } from "@ai-sdk/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Terminal, Lock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function Chat({
  appId,
  appUrl,
  authToken,
  sessionId,
  supabase_project,
  onResponseComplete,
  onSessionError,
}: {
  appId: string;
  appUrl: string;
  authToken: string;
  sessionId: string;
  supabase_project?: any;
  onResponseComplete?: () => void;
  onSessionError?: (error: string) => void;
}) {
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringMessageId, setRestoringMessageId] = useState<string | null>(
    null
  );
  const [limitReached, setLimitReached] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // Refs for tracking API calls - specific to this component instance
  const limitsApiCalled = useRef(false);
  const messagesApiCalled = useRef(false);

  // Keep track of the current session/app for proper reset
  const currentSessionId = useRef(sessionId);
  const currentAppId = useRef(appId);

  // Reset tracking if session/app changes
  if (
    currentSessionId.current !== sessionId ||
    currentAppId.current !== appId
  ) {
    limitsApiCalled.current = false;
    messagesApiCalled.current = false;
    currentSessionId.current = sessionId;
    currentAppId.current = appId;
  }

  // Check daily message limit
  const checkMessageLimit = async () => {
    try {
      const response = await fetch("/api/chat/limits", {
        headers: {
          Authorization: "Bearer " + authToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRemainingMessages(data.remaining);

        if (data.remaining <= 0) {
          setLimitReached(true);
        }
      }
    } catch (error) {
      console.error("Error checking message limit:", error);
    }
  };

  // Initial limits check - separate useEffect
  useEffect(() => {
    const fetchLimits = async () => {
      if (limitsApiCalled.current) {
        return;
      }

      limitsApiCalled.current = true;

      try {
        const response = await fetch("/api/chat/limits", {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRemainingMessages(data.remaining);

          if (data.remaining <= 0) {
            setLimitReached(true);
          }
        }
      } catch (error) {
        console.error("Error checking limits:", error);
      }
    };

    fetchLimits();
  }, [authToken]);

  // Fetch initial messages - separate useEffect
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId || !appId || messagesApiCalled.current) {
        return;
      }

      messagesApiCalled.current = true;
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/chat?sessionId=${sessionId}&appId=${appId}`,
          {
            headers: {
              Authorization: "Bearer " + authToken,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            // Session not found - it might be newly created
            setIsLoading(false);
            return;
          }

          if (onSessionError) {
            onSessionError("Failed to fetch messages");
          }
          throw new Error("Failed to fetch messages");
        }

        const messages = await response.json();
        setInitialMessages(
          messages.map((msg: any) => ({
            id: msg.message_id,
            role: msg.role,
            content: msg.content,
            parts: msg.metadata.parts,
          }))
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [sessionId, appId, authToken, onSessionError]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    addToolResult,
    error,
    isLoading: isChatLoading,
  } = useChat({
    api: `/api/chat/`,
    initialMessages: isLoading
      ? []
      : initialMessages.length > 0
      ? initialMessages
      : [],
    headers: {
      Authorization: "Bearer " + authToken,
    },
    body: {
      appUrl,
      appId,
      sessionId,
      supabase_project,
    },
    maxSteps: 30,
    onToolCall: async ({ toolCall }) => {
      // When a tool is called, ensure waiting indicator stays visible
      setIsWaitingForResponse(true);
      console.log("toolCall", toolCall);
      // Your existing tool call handling
      addToolResult({ toolCallId: toolCall.toolCallId, result: "Test" });
    },
    onResponse: async (response) => {
      // Check if we hit the rate limit
      if (response.status === 429) {
        setLimitReached(true);
        setLimitModalOpen(true);
        // Update remaining messages to 0
        setRemainingMessages(0);
        return;
      }
    },
    onFinish: async (message, options) => {
      // Save the AI message
      try {
        await fetch("/api/chat/ai-message-save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
          body: JSON.stringify({
            sessionId,
            appId,
            appUrl,
            options,
            message,
          }),
        });

        // Update message limit after successful message
        checkMessageLimit();
      } catch (error) {
        console.error("Error saving AI message:", error);
      }
      if (onResponseComplete) {
        onResponseComplete();
      }
      // Only remove the waiting indicator when everything is complete
      setIsWaitingForResponse(false);
    },
  });

  // Handle errors - check for 429 (rate limit)
  useEffect(() => {
    if (error) {
      console.error("Chat error:", error);
      // Check if the error is a rate limit error
      if (
        error.message &&
        (error.message.includes("429") ||
          error.message.includes("rate limit") ||
          error.message.includes("Daily message limit"))
      ) {
        setLimitReached(true);
        setLimitModalOpen(true);
        setRemainingMessages(0);
      }
      // Reset waiting state if there's an error
      setIsWaitingForResponse(false);
    }
  }, [error]);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (limitReached) {
      setLimitModalOpen(true);
      return;
    }

    // Set waiting indicator when submitting
    setIsWaitingForResponse(true);
    handleSubmit(e);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const messagesContainer = document.querySelector(".overflow-y-auto");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, isWaitingForResponse]);

  // Helper function to render message parts
  const renderMessagePart = (part: any) => {
    switch (part.type) {
      case "text":
        return <div className="text-sm">{part.text}</div>;
      case "tool-invocation":
        return (
          <div className="bg-muted/50 rounded-md p-3 my-2 border border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Terminal className="h-4 w-4" />
              <span>Tool: {part.toolInvocation.toolName}</span>
            </div>
            <div className="text-sm space-y-2">
              {part.toolInvocation.state === "result" ? (
                <>
                  <div className="text-muted-foreground">Result:</div>
                  <pre className="bg-muted rounded-md p-2 overflow-x-auto max-w-full">
                    <code
                      className="text-foreground whitespace-pre-wrap break-all"
                      style={{ wordBreak: "break-word" }}
                    >
                      {JSON.stringify(part.toolInvocation.result, null, 2)}
                    </code>
                  </pre>
                </>
              ) : (
                <>
                  <div className="text-muted-foreground">Arguments:</div>
                  <pre className="bg-muted rounded-md p-2 overflow-x-auto max-w-full">
                    <code
                      className="text-foreground whitespace-pre-wrap break-all"
                      style={{ wordBreak: "break-word" }}
                    >
                      {JSON.stringify(part.toolInvocation.args, null, 2)}
                    </code>
                  </pre>
                </>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleRestore = async (messageId: string) => {
    try {
      setRestoringMessageId(messageId);
      const response = await fetch("/api/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
        },
        body: JSON.stringify({
          messageId,
          appUrl,
          sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to restore checkpoint");
    } catch (error) {
      console.error("Error restoring checkpoint:", error);
    } finally {
      onResponseComplete?.();
      setRestoringMessageId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Message limit modal */}
      <Dialog open={limitModalOpen} onOpenChange={setLimitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              Daily Message Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've reached your daily message limit. Please try again tomorrow
              when your limit resets.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your limit will reset at midnight
          </p>
        </DialogContent>
      </Dialog>

      {/* Limit reached overlay */}
      {limitReached && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 p-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
            <Lock className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold">Message Limit Reached</h3>
          <p className="text-center text-muted-foreground max-w-md">
            You've used all your daily messages. Your limit will reset at
            midnight.
          </p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message.id || `message-${index}`}
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
                    {message.parts?.length ? (
                      message.parts.map((part, i) => (
                        <div key={i}>{renderMessagePart(part)}</div>
                      ))
                    ) : (
                      <div className="text-sm">{message.content}</div>
                    )}
                  </CardContent>
                </Card>
                {message.role === "assistant" && (
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-1"
                    onClick={() => handleRestore(message.id)}
                    disabled={restoringMessageId !== null || limitReached}
                  >
                    {restoringMessageId === message.id && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    )}
                    Restore Checkpoint
                  </button>
                )}
              </div>
            ))}

            {/* Waiting for AI response indicator (three dots) */}
            {isWaitingForResponse && (
              <div className="flex flex-col items-start">
                <Card className="max-w-[80%] bg-card text-card-foreground">
                  <CardContent className="p-4">
                    <div className="flex space-x-1">
                      <div
                        className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "600ms" }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-border p-4 bg-background">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              limitReached
                ? "Daily message limit reached"
                : "Type your message..."
            }
            className="flex-1"
            disabled={limitReached || isWaitingForResponse || isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={
              limitReached || isWaitingForResponse || !input.trim() || isLoading
            }
          >
            {isWaitingForResponse ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {remainingMessages !== null && !limitReached && (
          <div className="text-xs text-muted-foreground flex justify-end mt-2">
            <span>
              {remainingMessages} message{remainingMessages === 1 ? "" : "s"}{" "}
              remaining today
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
