"use client";

import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Lock, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ToolInvocation from "@/components/tool-render";
import { useImageUpload } from "@/hooks/use-image-upload";
import { updateSessionTitle } from "@/utils/session/session-utils";

// Add the ThreeDotsLoader component
const ThreeDotsLoader = () => (
  <div className="flex justify-center items-center space-x-1 py-2">
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: "0ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: "150ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: "300ms" }}
    ></div>
  </div>
);

export function Chat({
  appId,
  appUrl,
  authToken,
  sessionId,
  supabase_project,
  onResponseComplete,
  onSessionError,
  fetchSessions,
}: {
  appId: string;
  appUrl: string;
  authToken: string;
  sessionId: string;
  supabase_project?: any;
  onResponseComplete?: () => void;
  onSessionError?: (error: string) => void;
  fetchSessions?: () => void;
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

  // Use our updated custom hook for handling multiple images
  const {
    selectedImages,
    imagePreviews,
    isDragging,
    handleImageSelect,
    handleRemoveImage,
    resetImages,
    fileInputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useImageUpload();

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
        console.log("messages", messages);
        setInitialMessages(
          messages.map((msg: any) => ({
            id: msg.message_id,
            role: msg.role,
            content: msg.content,
            parts: msg.metadata.parts,
            experimental_attachments: msg.metadata.imageUrls
              ? msg.metadata.imageUrls.map((url: string) => ({
                  url: url,
                  contentType: "image/jpeg",
                  name: "image",
                }))
              : msg.metadata.imageUrl
              ? [
                  {
                    url: msg.metadata.imageUrl,
                    contentType: "image/jpeg",
                    name: "image",
                  },
                ]
              : undefined,
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

  const { messages, input, handleInputChange, handleSubmit, error } = useChat({
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
    onResponse: async (response) => {
      console.log("response", response);
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
      console.log("onFinish", message, options);
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

        if (messages.length === 0) {
          // Get the user's message and the AI's response
          const userMessage = messages[0]?.content;
          const aiMessage = message?.content;
          // Call the updateSessionTitle function
          await updateSessionTitle(
            userMessage,
            aiMessage,
            sessionId,
            authToken,
            () => {
              // Simply call fetchSessions as the callback
              fetchSessions?.();
            }
          );
        }
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (limitReached) {
      setLimitModalOpen(true);
      return;
    }

    // Don't proceed if there's nothing to send
    if (!input.trim() && selectedImages.length === 0) {
      return;
    }

    // Set waiting indicator when submitting
    setIsWaitingForResponse(true);

    try {
      // If there are images
      if (selectedImages.length > 0) {
        // For UI display only
        const imageAttachments = imagePreviews.map((preview, index) => ({
          name: selectedImages[index].name || `image-${index}.jpg`,
          contentType: "image/jpeg",
          url: preview,
        }));

        // Create properly formatted content for Claude
        // Claude expects each image to be a separate part in the array
        const messageContent = [];

        // Add text content first (if any)
        if (input.trim()) {
          messageContent.push({ type: "text", text: input });
        }

        // Add each image as a separate part
        imagePreviews.forEach((preview) => {
          messageContent.push({
            type: "image",
            image: preview,
          });
        });

        // Submit the message with both formats
        handleSubmit(e, {
          experimental_attachments: imageAttachments, // For UI display
          body: {
            appUrl,
            appId,
            sessionId,
            supabase_project,
            // Use the array of message parts
            multiModal: true, // Flag to indicate we're using the multimodal format
            messageParts: messageContent,
          },
        });

        // Important: Clear the image state right away
        resetImages();
      } else {
        // Regular text submission
        handleSubmit(e);
      }
    } catch (error) {
      console.error("Error processing message with images:", error);
      setIsWaitingForResponse(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const messagesContainer = document.querySelector(".overflow-y-auto");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, isWaitingForResponse]);

  // Update the renderMessagePart function
  const renderMessagePart = (part: any) => {
    switch (part.type) {
      case "text":
        return <div className="text-sm">{part.text}</div>;
      case "tool-invocation":
        return <ToolInvocation part={part} />;
      case "image":
        return (
          <img
            src={part.image}
            alt="Image in message"
            className="rounded border border-border shadow-sm mt-2 mb-2"
            style={{
              cursor: "pointer",
              maxHeight: "200px",
              objectFit: "contain",
            }}
          />
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
    <div
      className="flex flex-col h-full bg-background relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay indicator - now covering the entire chat interface */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-20 flex items-center justify-center border-2 border-dashed border-primary rounded-lg">
          <div className="text-center p-6 bg-background rounded-lg shadow-lg">
            <ImageIcon className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Drop your images here</p>
          </div>
        </div>
      )}

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
          <Button asChild>
            <Link href="/pricing">Upgrade</Link>
          </Button>
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
                    {/* Display multiple images if they exist */}
                    {message?.experimental_attachments && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {message.experimental_attachments.map(
                          (attachment, i) => (
                            <img
                              key={i}
                              src={attachment.url}
                              alt={`Uploaded image ${i + 1}`}
                              className="rounded border border-border shadow-sm"
                              style={{
                                cursor: "pointer",
                                height: "150px",
                                objectFit: "cover",
                              }}
                            />
                          )
                        )}
                      </div>
                    )}
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
          </>
        )}
      </div>

      {isWaitingForResponse && <ThreeDotsLoader />}

      {/* Input area - fixed at bottom */}
      <div className="border-t border-border p-4 bg-background">
        {/* Image previews area */}
        {imagePreviews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="h-20 rounded-md object-cover border border-border"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 hover:bg-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              limitReached
                ? "Daily message limit reached"
                : "Type your message or drop images anywhere..."
            }
            className="flex-1"
            disabled={limitReached || isWaitingForResponse || isLoading}
          />

          {/* File input for images (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
            disabled={limitReached || isWaitingForResponse || isLoading}
          />

          {/* Image upload button */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={limitReached || isWaitingForResponse || isLoading}
            title="Upload images"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {/* Send button */}
          <Button
            type="submit"
            size="icon"
            disabled={
              limitReached ||
              isWaitingForResponse ||
              (!input.trim() && selectedImages.length === 0) ||
              isLoading
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
