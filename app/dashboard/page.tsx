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
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getAuthToken } from "@/utils/client/auth";
import { checkMessageLimit } from "@/lib/chat-service";

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
  const { createApp, subscription } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [initialPromptLoaded, setInitialPromptLoaded] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
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
      //check if user can create app
      const authToken = getAuthToken();
      const result = await checkMessageLimit(authToken || "", subscription);
      if (result) {
        const { reachedLimit } = result;

        if (reachedLimit) {
          setLimitReached(true);
          return;
        }
      }
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
          </div>

          {/* Main prompt input */}
          <div className="mb-8">
            Sorry, we are currently making some changes to the app. Message us
            if you need help.
          </div>

          {limitReached && (
            <div className="bg-background/5 border rounded-lg p-4 text-center relative">
              <button
                onClick={() => setLimitReached(false)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <p className="font-medium text-foreground">
                Message limit reached
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span
                  className="text-primary cursor-pointer hover:underline"
                  onClick={() => router.push("/dashboard/pricing")}
                >
                  Upgrade your plan
                </span>{" "}
                for more messages
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
