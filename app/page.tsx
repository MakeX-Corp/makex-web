"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Code,
  Database,
  Layout,
  ShoppingCart,
  MessageSquare,
  Calendar,
  Music,
  PenTool,
  Book,
  Users,
  Map,
  CreditCard,
  Mail,
  FileText,
  Video,
  BarChart,
  Globe,
  Search,
  Briefcase,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  LogIn,
} from "lucide-react";
// Expanded app suggestion chips for multiple rows
const APP_SUGGESTIONS = [
  { icon: <Layout size={14} />, label: "Landing page" },
  { icon: <ShoppingCart size={14} />, label: "E-commerce" },
  { icon: <Database size={14} />, label: "Dashboard" },
  { icon: <MessageSquare size={14} />, label: "Chat app" },
  { icon: <Calendar size={14} />, label: "Calendar" },
  { icon: <Code size={14} />, label: "Portfolio" },
  { icon: <ImageIcon size={14} />, label: "Photo gallery" },
  { icon: <Music size={14} />, label: "Music player" },
  { icon: <PenTool size={14} />, label: "Blog" },
  { icon: <Book size={14} />, label: "Knowledge base" },
  { icon: <Users size={14} />, label: "Social network" },
  { icon: <Map size={14} />, label: "Travel planner" },
  { icon: <CreditCard size={14} />, label: "Finance tracker" },
  { icon: <Mail size={14} />, label: "Email client" },
  { icon: <FileText size={14} />, label: "Note taking" },
  { icon: <Video size={14} />, label: "Video streaming" },
  { icon: <BarChart size={14} />, label: "Analytics" },
  { icon: <Globe size={14} />, label: "News aggregator" },
  { icon: <Search size={14} />, label: "Search engine" },
  { icon: <Briefcase size={14} />, label: "Job board" },
];

// Example prompts
const EXAMPLE_PROMPTS = [
  "A markdown note-taking app with search and tagging",
  "A job application tracker that organizes applications by status",
  "A recipe app that suggests meals based on ingredients you have",
];

// Create three rows of suggestions for animation
const ROW_1 = APP_SUGGESTIONS.slice(0, 7);
const ROW_2 = APP_SUGGESTIONS.slice(7, 14);
const ROW_3 = APP_SUGGESTIONS.slice(14);

export default function DashboardPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  // Create refs with explicit typing
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Animation for moving suggestion pills
  useEffect(() => {
    // Modified the function to accept any ref type and handle null check inside
    const animateRow = (
      rowRef: { current: HTMLDivElement | null },
      direction: "left" | "right",
      speed: number
    ) => {
      if (!rowRef.current) return;

      let position = 0;
      const row = rowRef.current;
      const rowWidth = row.scrollWidth;
      const viewWidth = row.offsetWidth;

      // Set initial position based on direction
      if (direction === "right") {
        position = -rowWidth / 2;
      }

      const animate = () => {
        if (!row) return;

        // Update position
        if (direction === "left") {
          position -= speed;
          // Reset when enough content has scrolled by
          if (position <= -rowWidth / 2) {
            position = 0;
          }
        } else {
          position += speed;
          // Reset when enough content has scrolled by
          if (position >= 0) {
            position = -rowWidth / 2;
          }
        }

        // Apply the transformation
        row.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    // Start animations for each row with different speeds and directions
    animateRow(row1Ref, "left", 0.3);
    animateRow(row2Ref, "right", 0.2);
    animateRow(row3Ref, "left", 0.3);

    // Cleanup
    return () => {
      // Animation cleanup will happen automatically when component unmounts
    };
  }, []);

  const handleCreateApp = async () => {
    if (!prompt.trim()) return;

    try {
      setIsCreating(true);

      // Store the prompt in localStorage for persistence
      localStorage.setItem("makeX_home_prompt", prompt.trim());

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating app:", error);
      setIsCreating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  // Function to duplicate items for continuous scrolling effect
  const duplicateItemsForScrolling = (items: typeof APP_SUGGESTIONS) => {
    return [...items, ...items];
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header with logo */}
        <div className="mb-6 text-center">
          <div className="mb-2">
            <Image
              src="/logo.png"
              alt="makeX logo"
              width={128}
              height={32}
              className="mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Build any mobile app
          </h1>
        </div>

        {/* Moving suggestion pills in three rows */}
        <div className="mb-6">
          {/* Row 1 - scrolling left */}
          <div className="overflow-hidden mb-2">
            <div
              ref={row1Ref}
              className="flex whitespace-nowrap"
              style={{ willChange: "transform" }}
            >
              {duplicateItemsForScrolling(ROW_1).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap"
                >
                  {suggestion.icon}
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2 - scrolling right */}
          <div className="overflow-hidden mb-2">
            <div
              ref={row2Ref}
              className="flex whitespace-nowrap"
              style={{ willChange: "transform" }}
            >
              {duplicateItemsForScrolling(ROW_2).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap"
                >
                  {suggestion.icon}
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3 - scrolling left */}
          <div className="overflow-hidden">
            <div
              ref={row3Ref}
              className="flex whitespace-nowrap"
              style={{ willChange: "transform" }}
            >
              {duplicateItemsForScrolling(ROW_3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap"
                >
                  {suggestion.icon}
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main prompt input - Modified to remove background colors */}
        <div className="mb-8">
          <div className="relative border rounded-xl shadow-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your app idea in detail..."
              className="w-full px-6 pt-5 pb-16 resize-none focus:outline-none text-base bg-transparent transition-colors"
              rows={3}
              style={{ minHeight: "120px" }}
            />

            {/* Button area with clean design */}
            <div className="absolute bottom-0 left-0 right-0 py-3 px-4 border-t flex items-center justify-end">
              <div className="flex items-center mr-2">
                <Sparkles className="h-5 w-5 text-gray-400" />
              </div>

              <Button
                onClick={handleCreateApp}
                disabled={!prompt.trim() || isCreating}
                variant="default"
                className="font-medium rounded-md flex items-center disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Create App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
