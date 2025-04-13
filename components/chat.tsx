'use client';

import { useChat } from '@ai-sdk/react'
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { generateId } from 'ai';


export function Chat({ appId, appUrl, authToken, sessionId, onResponseComplete }: { appId: string, appUrl: string, authToken: string, sessionId: string, onResponseComplete?: () => void }) {
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringMessageId, setRestoringMessageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chat?sessionId=${sessionId}&appId=${appId}`, {
          headers: {
            Authorization: 'Bearer ' + authToken,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const messages = await response.json();
        setInitialMessages(messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        })));
        setIsLoading(false);
        console.log("messages", messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
      } 
    };


    if (sessionId && appId) {
      fetchMessages();
    }
  }, [sessionId, appId]);

  const { messages, input, handleInputChange, handleSubmit, addToolResult } = useChat({
    api: `/api/chat/`,
    initialMessages: isLoading ? [] : initialMessages.length > 0 ? initialMessages : [
      {
        id: 'initial-message',
        role: 'assistant',
        content: `    
    You are a helpful assistant that can read and write files. You can only write files in React Native.
    You cannot install any packages.
    You can also replace text in a file.
    You can also delete a file.
    You can also create a new file.
    You can also read a file.

    Don't say anything except calling the tools. 
    Try to do it in minimum tool calls.
    `,
      }
    ],
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
    body: {
      appUrl,
      appId,
      sessionId,
    },
    maxSteps: 5,
    onToolCall: async ({ toolCall }) => {
      // Handle tool calls here
      console.log("toolCall", toolCall);
      addToolResult({ toolCallId: toolCall.toolCallId, result: "Test" });
    },
    onFinish: () => {
      console.log("onFinish", messages);
      if (onResponseComplete) {
        onResponseComplete();
      }
    }
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const messagesContainer = document.querySelector('.overflow-y-auto');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  // Helper function to render message parts
  const renderMessagePart = (part: any) => {
    switch (part.type) {
      case 'text':
        return <div className="text-sm">{part.text}</div>;
      case 'tool-invocation':
        return (
          <div className="bg-slate-100 rounded p-2 my-2">
            <div className="font-medium">Tool: {part.toolInvocation.toolName}</div>
            <div className="text-sm">
              {part.toolInvocation.state === 'result' ? (
                <>
                  <div>Result: {JSON.stringify(part.toolInvocation.result)}</div>
                </>
              ) : (
                <div>Args: {JSON.stringify(part.toolInvocation.args)}</div>
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
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify({
          messageId,
          appUrl,
          sessionId,
        }),
      });

      console.log("response", response);

      if (!response.ok) throw new Error('Failed to restore checkpoint');
    } catch (error) {
      console.error('Error restoring checkpoint:', error);
    } finally {
      onResponseComplete?.();
      setRestoringMessageId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <Card className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-card-foreground'
              }`}>
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
              {message.role === 'assistant' && (
                <button 
                  className="text-[10px] text-gray-400 hover:text-gray-600 mt-0.5 flex items-center gap-1"
                  onClick={() => handleRestore(message.id)}
                  disabled={restoringMessageId !== null}
                >
                  {restoringMessageId === message.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  Restore Checkpoint
                </button>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Input area - fixed at bottom */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
