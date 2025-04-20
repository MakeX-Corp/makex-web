// components/ChatInput.tsx
import { Input } from "@/components/ui/input";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !inputValue.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
// Types
type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
};
