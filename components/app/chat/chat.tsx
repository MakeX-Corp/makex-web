"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send,
  Loader2,
  Image as ImageIcon,
  X,
  MoreVertical,
} from "lucide-react";
import ToolInvocation from "@/components/app/chat/tool-render";
import { useSession } from "@/context/session-context";
import { useApp } from "@/context/app-context";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/use-image-upload";
import {
  fetchChatMessages,
  checkMessageLimit,
  restoreCheckpoint,
} from "@/lib/chat-service";
import { updateSessionTitle } from "@/utils/client/session-utils";
import { ThreeDotsLoader } from "@/components/app/chat/three-dots-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { PausedAppModal } from "@/components/app/paused-app-modal";
import { AI_MODELS, DEFAULT_MODEL } from "@/const";
import type { UIMessagePart } from "ai";

type MessagePart = UIMessagePart<any, any>;

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
  const {
    appId,
    getCurrentSessionTitle,
    updateSessionTitle: contextUpdateSessionTitle,
    justCreatedSessionId,
  } = useSession();
  const { subscription, isAIResponding, setIsAIResponding } = useApp();
  const router = useRouter();

  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [booted, setBooted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storedPrompt, setStoredPrompt] = useState<string | null>(null);
  const [promptChecked, setPromptChecked] = useState(false);
  const [restoringMessageId, setRestoringMessageId] = useState<string | null>(
    null,
  );
  const [limitReached, setLimitReached] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isPausedAppModalOpen, setIsPausedAppModalOpen] = useState(false);

  const injectedPromptRef = useRef(false);
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

  // Function to reset textarea height
  const resetTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  // 1. Load storedPrompt from localStorage
  useEffect(() => {
    const prompt =
      typeof window !== "undefined"
        ? localStorage.getItem("makeX_prompt")
        : null;
    if (prompt) {
      setStoredPrompt(prompt);
      localStorage.removeItem("makeX_prompt");
    }
    setPromptChecked(true);
  }, []);

  // 2. Boot logic: fetch messages only if there's no prompt
  useEffect(() => {
    if (!promptChecked) return;

    const runBoot = async () => {
      if (storedPrompt) {
        setInitialMessages([]);
        setBooted(true);
        return;
      }

      if (!sessionId || !appId || justCreatedSessionId) {
        setInitialMessages([]);
        setBooted(true);
        return;
      }

      setIsLoading(true);
      try {
        const messages = await fetchChatMessages(sessionId, appId);
        setInitialMessages(messages);
      } catch (err) {
        console.error("[Chat Boot] Fetch error:", err);
        onSessionError?.("Failed to fetch messages");
      } finally {
        setIsLoading(false);
        setBooted(true);
      }
    };

    runBoot();
  }, [promptChecked, storedPrompt, sessionId, appId, justCreatedSessionId]);

  // 3. Check message limits
  useEffect(() => {
    let isMounted = true;

    const checkLimit = async () => {
      if (!subscription) return;

      setRemainingMessages(
        (subscription?.messagesLimit || 0) - (subscription?.messagesUsed || 0),
      );
      setLimitReached(
        (subscription?.messagesLimit || 0) -
          (subscription?.messagesUsed || 0) <=
          0,
      );
    };

    checkLimit();

    return () => {
      isMounted = false;
    };
  }, [subscription]);

  // 4. Initialize useChat
  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: sessionId,

    transport: new DefaultChatTransport({
      api: "/api/chat/",
    }),
    onFinish: (result) => {
      setIsAIResponding(false);
      onResponseComplete();
      // AI message saving is now handled in the chat endpoint's onFinish callback

      // Update session title if needed
      if (
        messages.length === 0 &&
        result.message.role === "assistant" &&
        getCurrentSessionTitle() === "New Chat"
      ) {
        // Extract text content from message parts
        const userMessageText =
          messages[0]?.parts?.find((part) => part.type === "text")?.text || "";
        const assistantMessageText =
          result.message.parts?.find((part) => part.type === "text")?.text ||
          "";

        updateSessionTitle(
          userMessageText,
          assistantMessageText,
          sessionId,
        ).then((newTitle) => {
          if (newTitle) {
            contextUpdateSessionTitle(sessionId, newTitle);
          }
        });
      }

      // Check message limits, might not need this could just decrement and see maybe

      checkMessageLimit().then((result) => {
        if (result) {
          const { remainingMessages, reachedLimit } = result;

          setRemainingMessages(remainingMessages);
          setLimitReached(reachedLimit);
        }
      });
    },
    onError: (error) => {
      console.error("Chat onError called:", error);
      setIsAIResponding(false);
    },
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);

  // 5. Handle cleanup on unmount
  useEffect(() => {
    return () => {
      setIsAIResponding(false);
    };
  }, [setIsAIResponding]);

  // 6. Inject prompt once
  useEffect(() => {
    if (storedPrompt && !injectedPromptRef.current && booted) {
      injectedPromptRef.current = true;
      setIsAIResponding(true);
      sendMessage(
        { text: storedPrompt },
        {
          body: {
            appId,
            sessionId,
            subscription,
            model: selectedModel,
          },
        },
      );
    }
  }, [
    storedPrompt,
    booted,
    sendMessage,
    setIsAIResponding,
    appId,
    sessionId,
    subscription,
  ]);

  // 7. Auto-scroll to bottom when messages change
  useEffect(() => {
    const messagesContainer = document.querySelector(".messages-container");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, isAIResponding]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (containerState !== "active") {
      setIsPausedAppModalOpen(true);
      return;
    }

    if (!input.trim() && selectedImages.length === 0) return;

    setIsAIResponding(true);

    try {
      /* ------- build parts array (text + images) ------- */
      const parts: MessagePart[] = [];

      parts.push({ type: "text", text: input.trim() });

      selectedImages.forEach((file, idx) => {
        parts.push({
          type: "file", // v5 uses generic file parts
          mediaType: file.type || "image/jpeg",
          filename: file.name || `image-${idx + 1}.jpg`,
          url: imagePreviews[idx], // data‑URL or remote URL
        });
      });

      /* ------- send one multimodal message ------- */
      sendMessage(
        { role: "user", parts },
        {
          body: {
            appId,
            sessionId,
            subscription,
            model: selectedModel,
          },
        },
      );

      /* ------- clean up ------- */
      resetImages();
      setInput("");
      resetTextareaHeight();
    } catch (err) {
      console.error("Error sending message:", err);
      setIsAIResponding(false);
    }
  };

  const renderMessagePart = (part: any) => {
    if (part.type.startsWith("tool-")) {
      return (
        <div className="overflow-x-auto max-w-full">
          <ToolInvocation part={part} />
        </div>
      );
    }

    switch (part.type) {
      case "text":
        return (
          <div className="text-sm whitespace-pre-wrap break-words break-all">
            {part.text}
          </div>
        );

      case "file":
        /* show images inline; fallback text for other mime types */
        if (part.mediaType?.startsWith("image/")) {
          return (
            <img
              src={part.url}
              alt={part.filename || "image"}
              className="rounded border border-border shadow-sm mt-2 mb-2"
              style={{
                cursor: "pointer",
                maxHeight: "200px",
                objectFit: "contain",
              }}
            />
          );
        }
        return (
          <a
            href={part.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs underline"
          >
            {part.filename || "file"}
          </a>
        );

      default:
        return null;
    }
  };

  // Handle checkpoint restoration
  const handleRestore = async (messageId: string) => {
    try {
      setRestoringMessageId(messageId);
      await restoreCheckpoint(messageId, appId, sessionId);
    } catch (error) {
      console.error("Error restoring checkpoint:", error);
    } finally {
      onResponseComplete();
      setRestoringMessageId(null);
    }
  };

  return (
    <div
      ref={chatContainerRef}
      className="flex flex-col h-full border rounded-md overflow-hidden relative chat-component"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay indicator */}
      {isDragging && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-primary/20 backdrop-blur-sm z-20 flex items-center justify-center border-4 border-dashed border-primary rounded pointer-events-none">
          <div className="text-center p-4 bg-background rounded shadow-lg">
            <ImageIcon className="h-10 w-10 text-primary mx-auto mb-2" />
            <p className="font-medium">Drop your images here</p>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <div className="messages-container h-full overflow-y-auto px-4 py-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 && !storedPrompt ? (
            <div className="text-center text-muted-foreground">
              No messages yet. Start a conversation!
            </div>
          ) : (
            messages.map((message, index) => {
              // Check if message has any visible content
              const hasVisibleContent = message.parts?.some((part: any) => {
                if (part.type === "step-start" || part.type === "step-end")
                  return false;
                if (part.type === "text")
                  return part.text && part.text.trim() !== "";
                return true; // Show other part types
              });

              // Don't render empty messages
              if (!hasVisibleContent) return null;

              return (
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
                    <CardContent className="p-4 overflow-hidden">
                      {message.parts?.length ? (
                        message.parts.map((part: any, i: number) => (
                          <div key={i}>{renderMessagePart(part)}</div>
                        ))
                      ) : (
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.parts?.find((part) => part.type === "text")
                            ?.text || ""}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Restore checkpoint button */}
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
              );
            })
          )}
        </div>
      </div>

      {isAIResponding && <ThreeDotsLoader />}

      {/* Input area - fixed at bottom */}
      <div className="border-t border-border p-4 bg-background relative">
        {limitReached && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="p-4 rounded-lg text-center">
              <p className="font-medium text-foreground">
                Message limit reached
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {subscription?.planName === "Free" ? (
                  <>
                    Try again tomorrow or{" "}
                    <span
                      className="text-primary cursor-pointer hover:underline"
                      onClick={() => router.push("/dashboard/pricing")}
                    >
                      upgrade your plan
                    </span>
                  </>
                ) : (
                  "Please upgrade your plan for more messages"
                )}
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

        <form
          ref={formRef}
          onSubmit={handleFormSubmit}
          className="flex gap-1.5"
        >
          {/* Model picker */}
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={isAIResponding || isLoading}
          >
            <SelectTrigger className="min-h-[38px] h-auto w-[24px] p-0 [&>svg:last-child]:hidden flex items-center justify-center">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);

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
                  new Event("submit", { bubbles: true, cancelable: true }),
                );
              }
            }}
            placeholder="Type your message or drop images anywhere..."
            className="flex-1 min-h-[38px] max-h-[200px] resize-none py-2 px-3 rounded-md border focus-visible:outline-none bg-background"
            rows={1}
            disabled={isAIResponding || isLoading}
          />

          {/* File input for images (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
            disabled={isAIResponding || isLoading}
          />

          {/* Image upload button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAIResponding || isLoading}
            title="Upload images"
            className="h-[38px] w-[38px] p-0"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {/* Send button */}
          <Button
            type="submit"
            size="sm"
            disabled={
              isAIResponding ||
              (!input.trim() && selectedImages.length === 0) ||
              isLoading
            }
            className="h-[38px] w-[38px] p-0"
          >
            {isAIResponding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Model name and remaining messages counter */}
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-muted-foreground">
            {AI_MODELS.find((model) => model.id === selectedModel)?.name ||
              selectedModel}
          </div>
          {(() => {
            if (remainingMessages !== null && !limitReached) {
              return (
                <div className="text-xs text-muted-foreground">
                  <span>
                    {remainingMessages} message
                    {remainingMessages === 1 ? "" : "s"} remaining{" "}
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            An error occurred. Please try again.
            <div className="text-xs mt-1">Error: {error.message}</div>
          </div>
        )}
      </div>

      {/* Paused App Modal */}
      <PausedAppModal
        open={isPausedAppModalOpen}
        onOpenChange={setIsPausedAppModalOpen}
      />
    </div>
  );
}
