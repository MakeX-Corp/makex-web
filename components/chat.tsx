'use client';

import { useChat } from '@ai-sdk/react'
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { getAuthToken } from '@/utils/client/auth';
export function Chat({ appId, appUrl }: { appId: string, appUrl: string }) {

  const decodedToken = getAuthToken();
  const { messages, input, handleInputChange, handleSubmit, addToolResult } = useChat({
    api: `/api/chat?appUrl=${appUrl}&appId=${appId}`,
    initialMessages: [{
      id: 'initial-message',
      role: 'assistant',
      content: `    
    You are a helpful assistant that can read and write files. You can only write files in React Native.
    You cannot install any packages.
    You can also replace text in a file.
    You can also delete a file.
    You can also create a new file.
    You can also read a file.

    Don't say too much except calling the tools. 
    If you need to say something, say it in the last message.
    Try to do it in minimum tool calls.
    `,
    }],
    headers: {
      Authorization: 'Bearer ' + decodedToken,
    },
    maxSteps: 5,
    onToolCall: async ({ toolCall }) => {
      // Handle tool calls here
      const result = await executeToolCall(toolCall);
      addToolResult({ toolCallId: toolCall.toolCallId, result });
    },
  });

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

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
          </div>
        ))}
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

// Helper function to execute tool calls
async function executeToolCall(toolCall: any) {
  // Implement your tool execution logic here
  // This is just a placeholder
  console.log('Executing tool:', toolCall);
  return { success: true };
}