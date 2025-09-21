"use client";

import { useRef } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onCreateApp: () => void;
  disabled?: boolean;
  className?: string;
}

export function PromptInput({
  prompt,
  onPromptChange,
  onCreateApp,
  disabled = false,
  className,
}: PromptInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
    onCreateApp();
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className || ""}`}>
      <div className="relative border rounded-xl shadow-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe your app idea in detail..."
          className="w-full px-6 pt-5 pb-16 resize-none focus:outline-none text-base bg-transparent transition-colors"
          rows={3}
          style={{ minHeight: "120px" }}
          disabled={disabled}
        />

        <div className="absolute bottom-0 left-0 right-0 py-3 px-4 border-t flex items-center justify-end">
          <div className="flex items-center mr-2">
            <Sparkles className="h-5 w-5 text-gray-400" />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || disabled}
            variant="default"
            className="font-medium rounded-md flex items-center disabled:opacity-50"
          >
            Create App
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
