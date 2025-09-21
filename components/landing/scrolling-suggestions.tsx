"use client";

import { useEffect, useRef } from "react";
import { getIconComponent } from "@/lib/iconMap";
import { APP_SUGGESTIONS } from "@/const";

interface ScrollingSuggestionsProps {
  suggestions: typeof APP_SUGGESTIONS;
  direction: "left" | "right";
  speed: number;
  onSuggestionClick: (suggestion: (typeof APP_SUGGESTIONS)[0]) => void;
  className?: string;
}

export function ScrollingSuggestions({
  suggestions,
  direction,
  speed,
  onSuggestionClick,
  className,
}: ScrollingSuggestionsProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const duplicatedSuggestions = [...suggestions, ...suggestions];

  useEffect(() => {
    const animateRow = () => {
      if (!rowRef.current) return;

      let position = 0;
      const row = rowRef.current;
      const rowWidth = row.scrollWidth;

      if (direction === "right") {
        position = -rowWidth / 2;
      }

      const animate = () => {
        if (!row) return;

        if (direction === "left") {
          position -= speed;
          if (position <= -rowWidth / 2) {
            position = 0;
          }
        } else {
          position += speed;
          if (position >= 0) {
            position = -rowWidth / 2;
          }
        }

        row.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    animateRow();
  }, [direction, speed]);

  return (
    <div className={`overflow-hidden ${className || ""}`}>
      <div
        ref={rowRef}
        className="flex whitespace-nowrap"
        style={{ willChange: "transform" }}
      >
        {duplicatedSuggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.label}-${index}`}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
          >
            {getIconComponent(suggestion.iconName)}
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
