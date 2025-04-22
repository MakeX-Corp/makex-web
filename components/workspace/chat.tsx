/*

"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  sessionId?: string;
  isProcessing?: boolean;
  isAppReady?: boolean; // Add this prop to check if the app is ready
}

export function ChatInput({
  onSendMessage,
  sessionId,
  isProcessing = false,
  isAppReady = true, // Default to false to be safe
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [loadTimestamp, setLoadTimestamp] = useState(new Date().toISOString());
  const initialPromptChecked = useRef(false);

  // Update the timestamp whenever sessionId changes and reset the check flag
  useEffect(() => {
    setLoadTimestamp(new Date().toISOString());
    console.log(`Chat component reloaded for session: ${sessionId}`);
    initialPromptChecked.current = false; // Reset the check when session changes
  }, [sessionId]);

  // Check for prompt in local storage when component loads or when app becomes ready
  useEffect(() => {
    // Only proceed if session is valid, app is ready, and we haven't checked yet for this session
    if (
      sessionId &&
      isAppReady &&
      !initialPromptChecked.current &&
      !isProcessing
    ) {
      initialPromptChecked.current = true; // Mark as checked to prevent multiple sends

      try {
        // Get the stored prompt from localStorage
        const storedPrompt = localStorage.getItem(`initialPrompt_${sessionId}`);

        if (storedPrompt) {
          console.log(
            `Found stored prompt for session ${sessionId}, sending...`
          );
          onSendMessage(storedPrompt);

          // Remove the prompt from localStorage after sending
          localStorage.removeItem(`initialPrompt_${sessionId}`);
        } else {
          console.log(`No stored prompt found for session ${sessionId}`);
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      }
    }
  }, [sessionId, isAppReady, isProcessing, onSendMessage]);

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

  if (sessionId === "") {
    return <div>No active session</div>;
  }

  return (
    <Card className="flex flex-col h-full border rounded-md">
      <CardContent className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="p-4 border rounded-md bg-muted/30">
            <div className="mb-2">
              <strong>Session ID:</strong> {sessionId || "Not set"}
            </div>
            <div>
              <strong>Component loaded at:</strong> {loadTimestamp}
            </div>
            <div>
              <strong>App Ready:</strong> {isAppReady ? "Yes" : "No"}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              This component will automatically send a prompt from localStorage
              if available when the session changes and the app is ready.
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
*/

"use client";

import { useChat } from "@ai-sdk/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import ToolInvocation from "@/components/tool-render";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useSession } from "@/context/session-context";
import {
  fetchChatMessages,
  saveAIMessage,
  restoreCheckpoint,
} from "@/lib/chat-service";
import { ThreeDotsLoader } from "@/components/workspace/three-dots-loader";

interface ChatProps {
  sessionId: string;
  authToken: string;
  onResponseComplete?: () => void;
  onSessionError?: (error: string) => void;
  fetchSessions?: () => void;
}

export function Chat({
  sessionId,
  authToken,
  onResponseComplete,
  onSessionError,
  fetchSessions,
}: ChatProps) {
  // Get app context from the SessionContext
  const { appId, apiUrl, supabaseProject } = useSession();

  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringMessageId, setRestoringMessageId] = useState<string | null>(
    null
  );
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // Use image upload custom hook
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
  const messagesApiCalled = useRef(false);

  // Keep track of the current session/app for proper reset
  const currentSessionId = useRef(sessionId);
  const currentAppId = useRef(appId);

  // Reset tracking if session/app changes
  if (
    currentSessionId.current !== sessionId ||
    currentAppId.current !== appId
  ) {
    messagesApiCalled.current = false;
    currentSessionId.current = sessionId;
    currentAppId.current = appId;
  }

  // Fetch initial messages
  useEffect(() => {
    const getMessages = async () => {
      if (!sessionId || !appId || messagesApiCalled.current) {
        return;
      }

      messagesApiCalled.current = true;
      setIsLoading(true);

      try {
        const messages = await fetchChatMessages(sessionId, appId, authToken);
        setInitialMessages(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        if (onSessionError) {
          onSessionError("Failed to fetch messages");
        }
      } finally {
        setIsLoading(false);
      }
    };

    getMessages();
  }, [sessionId, appId, authToken, onSessionError]);

  const { messages, input, handleInputChange, handleSubmit, error } = useChat({
    api: `/api/chat/`,
    initialMessages: isLoading
      ? []
      : initialMessages.length > 0
      ? initialMessages
      : [],
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: {
      apiUrl,
      appId,
      sessionId,
      supabaseProject,
    },
    maxSteps: 30,
    onResponse: async (response) => {
      console.log("response", response);
    },
    onFinish: async (message, options) => {
      // Save the AI message
      console.log("onFinish", message, options);
      try {
        await saveAIMessage(
          sessionId,
          appId || "",
          apiUrl,
          options,
          message,
          authToken
        );
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

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Chat error:", error);
      // Reset waiting state if there's an error
      setIsWaitingForResponse(false);
    }
  }, [error]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        const messageContent: any[] = [];

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
            apiUrl,
            appId,
            sessionId,
            supabaseProject,
            // Use the array of message parts
            multiModal: true, // Flag to indicate we're using the multimodal format
            messageParts: messageContent,
          },
        });

        // Important: Clear the image state right away
        resetImages();
      } else {
        console.log("messageContent");
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

  // Render message part based on type
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
      await restoreCheckpoint(messageId, apiUrl, sessionId, authToken);
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
      {/* Drag overlay indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-20 flex items-center justify-center border-2 border-dashed border-primary rounded-lg">
          <div className="text-center p-6 bg-background rounded-lg shadow-lg">
            <ImageIcon className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Drop your images here</p>
          </div>
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
                          (attachment: any, i: number) => (
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
                      message.parts.map((part: any, i: number) => (
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
                    disabled={restoringMessageId !== null}
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
            placeholder="Type your message or drop images anywhere..."
            className="flex-1"
            disabled={isWaitingForResponse || isLoading}
          />

          {/* File input for images (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
            disabled={isWaitingForResponse || isLoading}
          />

          {/* Image upload button */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWaitingForResponse || isLoading}
            title="Upload images"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {/* Send button */}
          <Button
            type="submit"
            size="icon"
            disabled={
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
      </div>
    </div>
  );
}
