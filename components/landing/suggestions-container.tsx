"use client";

import { ScrollingSuggestions } from "./scrolling-suggestions";
import { ROW_1, ROW_2, ROW_3, APP_SUGGESTIONS } from "@/const";

interface SuggestionsContainerProps {
  onSuggestionClick: (suggestion: (typeof APP_SUGGESTIONS)[0]) => void;
  className?: string;
}

export function SuggestionsContainer({
  onSuggestionClick,
  className,
}: SuggestionsContainerProps) {
  return (
    <div className={`w-full max-w-4xl mx-auto ${className || ""}`}>
      <div className="space-y-2">
        <ScrollingSuggestions
          suggestions={ROW_1}
          direction="left"
          speed={0.3}
          onSuggestionClick={onSuggestionClick}
        />
        <ScrollingSuggestions
          suggestions={ROW_2}
          direction="right"
          speed={0.2}
          onSuggestionClick={onSuggestionClick}
        />
        <ScrollingSuggestions
          suggestions={ROW_3}
          direction="left"
          speed={0.3}
          onSuggestionClick={onSuggestionClick}
        />
      </div>
    </div>
  );
}
