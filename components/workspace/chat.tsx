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
  checkMessageLimit,
} from "@/lib/chat-service";
import { ThreeDotsLoader } from "@/components/workspace/three-dots-loader";
import { updateSessionTitle } from "@/utils/session/session-utils";
import { useApp } from "@/context/AppContext";

interface ChatProps {
  sessionId: string;
  onResponseComplete?: () => void;
  onSessionError?: (error: string) => void;
}

export function Chat({
  sessionId,
  onResponseComplete,
  onSessionError,
}: ChatProps) {
  // Get app context from the SessionContext
  const { appId, apiUrl, supabaseProject, sessionName, setSessionName } =
    useSession();
  const { authToken, subscription } = useApp();
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringMessageId, setRestoringMessageId] = useState<string | null>(
    null
  );
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [initialPromptSent, setInitialPromptSent] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );
  // Refs for the input and form elements
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
        const messages = await fetchChatMessages(
          sessionId,
          appId,
          authToken || ""
        );
        setInitialMessages(messages);

        if (authToken && subscription) {
          await initialCheck();
        }
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

  const initialCheck = async () => {
    const result = await checkMessageLimit(authToken || "", subscription);
    if (result) {
      const { remainingMessages, reachedLimit } = result;
      setRemainingMessages(remainingMessages);
      setLimitReached(reachedLimit);
    }
  };

  const { messages, input, handleInputChange, handleSubmit, error } = useChat({
    id: sessionId,
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
      subscription,
    },
    maxSteps: 30,
    onResponse: async (response) => {},
    onFinish: async (message, options) => {
      // Save the AI message
      try {
        await saveAIMessage(
          sessionId,
          appId || "",
          apiUrl,
          options,
          message,
          authToken || ""
        );
        // If this is the first AI response and title hasn't been updated yet
        if (
          messages.length === 0 &&
          message.role === "assistant" &&
          sessionName === "New Chat"
        ) {
          const userMessage = messages[0]?.content || "";
          // Get the AI response (the current message)
          const aiResponse = message.content || "";
          const newTitle = await updateSessionTitle(
            userMessage,
            aiResponse,
            sessionId,
            authToken || ""
          );
          if (newTitle) {
            setSessionName(newTitle);
          }
        }
        // Update message limit after successful message
        const result = await checkMessageLimit(authToken || "", subscription);
        if (result) {
          const { remainingMessages, reachedLimit } = result;
          setRemainingMessages(remainingMessages);
          setLimitReached(reachedLimit);
        }
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

  useEffect(() => {
    if (!isLoading && !initialPromptSent && messages.length === 0) {
      const storedPrompt = localStorage.getItem("makeX_prompt");
      if (storedPrompt && chatContainerRef.current) {
        // Remove the prompt from storage
        localStorage.removeItem("makeX_prompt");

        // Find the textarea within THIS component only
        const textareaElement =
          chatContainerRef.current.querySelector("textarea");

        if (textareaElement) {
          // Set textarea value
          const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
          )?.set;

          if (nativeTextareaValueSetter) {
            nativeTextareaValueSetter.call(textareaElement, storedPrompt);
            textareaElement.dispatchEvent(
              new Event("input", { bubbles: true })
            );

            // Also trigger the auto-resize logic
            textareaElement.style.height = "auto";
            const newHeight = Math.min(textareaElement.scrollHeight, 200);
            textareaElement.style.height = `${newHeight}px`;

            // Find form within THIS component
            const formElement = chatContainerRef.current.querySelector("form");
            if (formElement) {
              // Short timeout to ensure state is updated
              setTimeout(() => {
                formElement.dispatchEvent(
                  new Event("submit", { bubbles: true, cancelable: true })
                );
                setInitialPromptSent(true);
              }, 100);
            }
          }
        }
      } else {
        setInitialPromptSent(true);
      }
    }
  }, [isLoading, messages.length, initialPromptSent]);
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
    const messagesContainer = document.querySelector(".messages-container");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, isWaitingForResponse]);

  // Focus the input field when the chat component loads
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

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
      await restoreCheckpoint(messageId, apiUrl, sessionId, authToken || "");
    } catch (error) {
      console.error("Error restoring checkpoint:", error);
    } finally {
      onResponseComplete?.();
      setRestoringMessageId(null);
    }
  };

  return (
    <div
      ref={chatContainerRef}
      className="flex flex-col h-full overflow-hidden border rounded-md chat-component"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay indicator with improved visibility */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm z-20 flex items-center justify-center border-4 border-dashed border-primary rounded-lg pointer-events-none">
          <div className="text-center p-6 bg-background rounded-lg shadow-lg">
            <ImageIcon className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Drop your images here</p>
          </div>
        </div>
      )}

      {/* Messages area - added fixed height with messages-container class */}
      <div className="flex-1 overflow-hidden">
        <div className="messages-container h-full overflow-y-auto px-4 py-4 space-y-4">
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
      </div>

      {isWaitingForResponse && <ThreeDotsLoader />}

      {/* Input area - fixed at bottom */}
      <div className="border-t border-border p-4 bg-background relative">
        {limitReached && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="p-4 rounded-lg text-center">
              <p className="font-medium text-foreground">
                Message limit reached
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {subscription?.planName === "Free"
                  ? "Try again tomorrow or upgrade your plan"
                  : "Please upgrade your plan for more messages"}
              </p>
            </div>
          </div>
        )}

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

        <form ref={formRef} onSubmit={handleFormSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              handleInputChange(e);

              // Auto-resize logic
              e.target.style.height = "auto";
              const newHeight = Math.min(e.target.scrollHeight, 200); // Max height of 200px
              e.target.style.height = `${newHeight}px`;
            }}
            onKeyDown={(e) => {
              // Submit on Enter (without Shift key)
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.dispatchEvent(
                  new Event("submit", { bubbles: true, cancelable: true })
                );
              }
            }}
            placeholder="Type your message or drop images anywhere..."
            className="flex-1 min-h-[38px] max-h-[200px] py-2 px-3 rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            disabled={isWaitingForResponse || isLoading}
            rows={1}
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
        {remainingMessages !== null && !limitReached && (
          <div className="text-xs text-muted-foreground flex justify-end mt-2">
            <span>
              {remainingMessages} message{remainingMessages === 1 ? "" : "s"}{" "}
              remaining{" "}
              {subscription?.planName === "Free" ? "today" : "in this cycle"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
