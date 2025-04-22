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
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

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

// Create three rows of suggestions for animation
const ROW_1 = APP_SUGGESTIONS.slice(0, 7);
const ROW_2 = APP_SUGGESTIONS.slice(7, 14);
const ROW_3 = APP_SUGGESTIONS.slice(14);

// Enhanced LoadingModal component
const LoadingModal = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-background rounded-xl p-8 flex flex-col items-center justify-center gap-5 shadow-lg border border-primary/20 max-w-md w-full mx-4">
        <div className="relative">
          {/* Outer spinning circle */}
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/60 animate-spin w-16 h-16"></div>

          {/* Inner pulsing circle with rotating dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 relative">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary rounded-full opacity-0"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${i * 45}deg) translateY(-150%) scale(${
                      i % 2 ? 0.7 : 1
                    })`,
                    animation: `fadeInOut 1.5s infinite ${i * 0.2}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Center sparkle icon */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Creating Your App</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Building your app with AI...
          </p>
        </div>

        {/* Progress bar animation */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
};

// Add these styles to your global CSS file
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes fadeInOut {
      0%,
      100% {
        opacity: 0;
        transform: scale(0);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes progress {
      0% {
        width: 5%;
      }
      50% {
        width: 70%;
      }
      90% {
        width: 90%;
      }
      100% {
        width: 95%;
      }
    }

    .animate-progress {
      animation: progress 3s ease-in-out infinite;
    }
  `}</style>
);

export default function DashboardPage() {
  const router = useRouter();
  const { createApp } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [initialPromptLoaded, setInitialPromptLoaded] = useState(false);

  // Create refs with explicit typing
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check localStorage for initial prompt - only on initial mount
  useEffect(() => {
    if (!initialPromptLoaded) {
      const storedPrompt = localStorage.getItem("makeX_home_prompt");
      if (storedPrompt) {
        // Update the state
        setPrompt(storedPrompt);

        // Clear the localStorage item after retrieving it
        localStorage.removeItem("makeX_home_prompt");

        // Focus the textarea
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
      setInitialPromptLoaded(true);
    }
  }, [initialPromptLoaded]);

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
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
    setIsCreating(true);
    try {
      localStorage.setItem("makeX_prompt", prompt);
      const redirectUrl = await createApp(prompt);
      router.push(redirectUrl);
    } catch (error) {
      console.error("Error creating app:", error);
    } finally {
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
    <>
      <GlobalStyles />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header with logo */}
          {isCreating && <LoadingModal />}
          <div className="mb-10 text-center">
            <div className="mb-2">
              <Image
                src="/logo.png"
                alt="makeX logo"
                width={128}
                height={32}
                className="mx-auto"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              What do you want to build?
            </h1>
          </div>

          {/* Moving suggestion pills in three rows */}
          <div className="mb-8">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                  >
                    {suggestion.icon}
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main prompt input */}
          <div className="mb-8">
            <div className="relative bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl shadow-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
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
              <div className="absolute bottom-0 left-0 right-0 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex items-center justify-end">
                <div className="flex items-center mr-2">
                  <Sparkles className="h-5 w-5 text-gray-400" />
                </div>

                <Button
                  onClick={handleCreateApp}
                  disabled={!prompt.trim()}
                  variant="default"
                  className="font-medium rounded-md flex items-center disabled:opacity-50"
                >
                  Create App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
