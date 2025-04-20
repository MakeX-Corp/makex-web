// app/workspace/[appId]/[sessionId]/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Preview } from "@/components/workspace/preview";
import { ChatInput } from "@/components/workspace/chat";
// Types
type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
};
// Hardcoded sample data
const SAMPLE_MESSAGES = [
  {
    id: "msg1",
    content: "Create a simple landing page for my SaaS app",
    role: "user",
    timestamp: "2023-04-20T10:30:00Z",
  },
  {
    id: "msg2",
    content:
      "I'll help you create a landing page for your SaaS app. What's the main purpose of your app?",
    role: "assistant",
    timestamp: "2023-04-20T10:30:05Z",
  },
  {
    id: "msg3",
    content: "It's a productivity tool that helps teams collaborate better",
    role: "user",
    timestamp: "2023-04-20T10:31:00Z",
  },
  {
    id: "msg4",
    content:
      "Great! I'll create a landing page focused on team collaboration and productivity benefits. Let me know if you have any specific color preferences or branding guidelines.",
    role: "assistant",
    timestamp: "2023-04-20T10:31:10Z",
  },
];

export default function SessionPage({
  params,
}: {
  params: { appId: string; sessionId: string };
}) {
  const [messages, setMessages] = useState<any>(SAMPLE_MESSAGES);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Check for initial prompt in session storage
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem("initialPrompt");
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
      sessionStorage.removeItem("initialPrompt");
    }
  }, []);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    setIsSending(true);

    // Add user message
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev: any) => [...prev, newUserMessage]);

    // Simulate assistant response after a short delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: `Here's a response to: "${content}"`,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev: any) => [...prev, assistantMessage]);
      setIsSending(false);
    }, 1000);
  };

  return (
    <>
      {/* Chat Section */}
      <div className="flex w-1/2 flex-col border-r">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message: any) => (
            <div
              key={message.id}
              className={`mb-4 rounded-lg p-3 ${
                message.role === "user" ? "ml-8 bg-muted" : "mr-8 bg-primary/10"
              }`}
            >
              <div className="text-sm font-semibold">
                {message.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
        </div>
      </div>

      {/* Preview Section */}
      <Preview />
    </>
  );
}
