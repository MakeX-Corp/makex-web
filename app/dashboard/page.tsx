"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Sparkles, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodeRedemption } from "@/components/code-redemption";
import { APP_SUGGESTIONS, ROW_1, ROW_2, ROW_3 } from "@/const";
import { getIconComponent } from "@/lib/iconMap";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);

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
      speed: number,
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
    setCurrentStep(0);

    try {
      // Simulate setup steps while waiting for response
      const steps = [
        "Setting up your files...",
        "Configuring cloud environment...",
        "Warming up AI models...",
        "Finalizing setup...",
      ];

      // Start the step animation
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1000);

      localStorage.setItem("makeX_prompt", prompt);
      const redirectUrl = await createApp(prompt);

      // Clear the interval and redirect
      clearInterval(stepInterval);
      router.push(redirectUrl);
    } catch (error) {
      console.error("Error creating app:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSuggestionClick = (suggestion: (typeof APP_SUGGESTIONS)[0]) => {
    setPrompt(suggestion.prompt);
  };

  const handleUnlimitedChange = (unlimited: boolean) => {
    setIsUnlimited(unlimited);
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
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              What do you want to build?
            </h1>

            {/* Code redemption component */}
            <CodeRedemption onUnlimitedChange={handleUnlimitedChange} />
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
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                  >
                    {getIconComponent(suggestion.iconName)}
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
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                  >
                    {getIconComponent(suggestion.iconName)}
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
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                  >
                    {getIconComponent(suggestion.iconName)}
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main prompt input */}
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

        <Dialog open={isCreating} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                Setting Up Your App
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-4">
              {[
                "Setting up your files...",
                "Configuring cloud environment...",
                "Warming up AI models...",
                "Finalizing setup...",
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index === currentStep
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : index < currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step}</div>
                  </div>
                  {index === currentStep && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-r-transparent"></div>
                  )}
                  {index < currentStep && (
                    <div className="text-primary">
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
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
