"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, Code, ArrowRight } from "lucide-react";
import Image from "next/image";
import WaitlistContainer from "@/components/waitlist-container";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  APP_SUGGESTIONS,
  ROW_1,
  ROW_2,
  ROW_3,
  ANIMATION_TIMINGS,
  DEMO_PROMPT,
  DEMO_CODE_SNIPPETS,
  REALISTIC_CODE_DEMO,
} from "@/const";
import { getIconComponent } from "@/lib/iconMap";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [codeIndex, setCodeIndex] = useState(0);
  const [gameState, setGameState] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const codeRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCode, setGeneratingCode] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  // Using demo prompt from constants
  const [isLooping, setIsLooping] = useState(true);

  // App creation state
  const router = useRouter();

  const [prompt, setPrompt] = useState("");

  // Create refs for animation
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Using code snippets from constants
  const codeSnippets = DEMO_CODE_SNIPPETS;

  // Using realistic code from constants
  const realisticCode = REALISTIC_CODE_DEMO;

  useEffect(() => {
    setMounted(true);

    // Code typing animation
    const codeInterval = setInterval(() => {
      setCodeIndex((prev) => {
        if (prev < codeSnippets.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 150);

    // Tic-tac-toe game simulation - only run in step 2
    let gameInterval: NodeJS.Timeout | null = null;
    if (step === 2) {
      gameInterval = setInterval(() => {
        setGameState((prev) => {
          const emptyCells = prev
            .map((cell, idx) => (cell === null ? idx : null))
            .filter((idx) => idx !== null);
          if (emptyCells.length === 0) {
            return Array(9).fill(null);
          }

          const randomIndex = emptyCells[
            Math.floor(Math.random() * emptyCells.length)
          ] as number;
          const newState = [...prev];
          newState[randomIndex] = currentPlayer;
          setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
          return newState;
        });
      }, 1000);
    }

    // Scroll code into view as it's typed
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }

    return () => {
      clearInterval(codeInterval);
      if (gameInterval) clearInterval(gameInterval);
    };
  }, [codeIndex, currentPlayer, step]);

  useEffect(() => {
    if (mounted && !isTyping) {
      // Only start if not already typing
      simulateTyping();
    }
  }, [mounted]); // Remove other dependencies

  // App creation functions
  const handleCreateApp = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    // Store the prompt in localStorage for the dashboard to use

    // Redirect to dashboard instead of creating the app
    router.push("/dashboard");
  };

  const handleSuggestionClick = (suggestion: (typeof APP_SUGGESTIONS)[0]) => {
    setPrompt(suggestion.prompt);
  };

  // Function to duplicate items for continuous scrolling effect
  const duplicateItemsForScrolling = (items: typeof APP_SUGGESTIONS) => {
    return [...items, ...items];
  };

  // Animation for moving suggestion pills
  useEffect(() => {
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

  const startGeneration = () => {
    setStep(1);

    // Create multiple copies of the code to fill the screen
    const repeatedCode = Array(5).fill(realisticCode).flat();
    setGeneratingCode(repeatedCode);

    // Move to game after animation
    setTimeout(() => {
      setStep(2);
      // Reset to home page after showing game for 5 seconds
      setTimeout(() => {
        setStep(0);
        setUserPrompt("");
        setGameState(Array(9).fill(null));
        simulateTyping(); // Start the loop again
      }, 5000);
    }, 4000);
  };

  const simulateTyping = () => {
    if (isTyping) return; // Prevent multiple typing instances

    setIsTyping(true);
    setUserPrompt(""); // Clear existing text

    setTimeout(() => {
      let i = 0;
      const typingInterval = setInterval(() => {
        setUserPrompt(DEMO_PROMPT.slice(0, i + 1));
        i++;
        if (i === DEMO_PROMPT.length) {
          clearInterval(typingInterval);
          setIsTyping(false);
          // Add small delay before starting generation
          setTimeout(() => {
            startGeneration();
          }, 500);
        }
      }, ANIMATION_TIMINGS.TYPING_SPEED);

      // Cleanup function
      return () => clearInterval(typingInterval);
    }, ANIMATION_TIMINGS.TYPING_INITIAL_DELAY);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background/95 to-background/90 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-purple-500/5 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-1/4 h-1/4 bg-blue-500/5 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 mt-0">
        <div className="container px-4 py-1 flex flex-col items-center text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="MakeX Logo"
                width={48}
                height={48}
                className="h-12 w-12 md:h-16 md:w-16"
              />
            </div>
          </div>

          <h1 className="text-3xl md:text-7xl font-bold tracking-tight mb-2 md:mb-4 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            MakeX
          </h1>

          <p className="text-lg md:text-2xl text-muted-foreground max-w-[600px] mb-4 md:mb-8 animate-fade-in-delay">
            Turn ideas into apps. Instantly.
          </p>

          <div className="w-full max-w-md mb-4 md:mb-8 animate-fade-in-delay-2">
            <WaitlistContainer />
          </div>

          {/* App Creation Section */}
          <div className="w-full max-w-4xl mx-auto mb-8 animate-fade-in-delay-3">
            {/* Moving suggestion pills in three rows */}
            <div className="mb-8">
              {/* Row 1 - scrolling left */}
              <div className="overflow-hidden mb-2">
                <div
                  ref={row1Ref}
                  className="flex whitespace-nowrap"
                  style={{ willChange: "transform" }}
                >
                  {duplicateItemsForScrolling(ROW_1).map(
                    (suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                      >
                        {getIconComponent(suggestion.iconName)}
                        {suggestion.label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Row 2 - scrolling right */}
              <div className="overflow-hidden mb-2">
                <div
                  ref={row2Ref}
                  className="flex whitespace-nowrap"
                  style={{ willChange: "transform" }}
                >
                  {duplicateItemsForScrolling(ROW_2).map(
                    (suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                      >
                        {getIconComponent(suggestion.iconName)}
                        {suggestion.label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Row 3 - scrolling left */}
              <div className="overflow-hidden">
                <div
                  ref={row3Ref}
                  className="flex whitespace-nowrap"
                  style={{ willChange: "transform" }}
                >
                  {duplicateItemsForScrolling(ROW_3).map(
                    (suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                      >
                        {getIconComponent(suggestion.iconName)}
                        {suggestion.label}
                      </button>
                    ),
                  )}
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

          {/* Updated iPhone Mockup with better mobile responsiveness */}
          <div className="relative mx-auto animate-float-slow mb-4 md:mb-8 scale-110 md:scale-125">
            <div className="relative w-[280px] sm:w-[320px] h-[570px] sm:h-[650px] rounded-[44px] bg-black p-[10px] sm:p-[12px] shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[20px] sm:h-[25px] w-[120px] sm:w-[150px] bg-black rounded-b-[14px] z-20" />

              {/* Screen */}
              <div className="relative h-full w-full rounded-[28px] sm:rounded-[32px] overflow-hidden bg-white">
                <div className="flex h-full flex-col">
                  {/* App Header */}
                  <div className="flex-none h-10 sm:h-14 bg-white border-b flex items-center justify-between px-3 sm:px-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        MakeX
                      </span>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="flex-grow overflow-hidden p-2 sm:p-4">
                    {step === 0 && (
                      <div className="h-full flex flex-col items-center justify-center space-y-3 sm:space-y-6 px-2 sm:px-4">
                        <div className="text-center space-y-1 sm:space-y-2">
                          <h3 className="text-base sm:text-xl font-semibold text-gray-900">
                            What would you like to build?
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Describe your app idea in simple words
                          </p>
                        </div>
                        <input
                          type="text"
                          value={userPrompt}
                          readOnly
                          placeholder="e.g. AI podcast summariser"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm"
                        />
                        <button
                          onClick={simulateTyping}
                          disabled={isTyping}
                          className="w-full bg-primary text-white rounded-xl py-2 sm:py-3 font-medium disabled:opacity-50 text-xs sm:text-sm"
                        >
                          {isTyping ? "Typing..." : "Generate App →"}
                        </button>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="h-full w-full bg-white overflow-hidden">
                        <div
                          className="h-full font-mono text-[10px] sm:text-xs whitespace-pre animate-scroll-up"
                          style={{
                            willChange: "transform",
                          }}
                        >
                          {generatingCode.map((line, i) => (
                            <div
                              key={i}
                              className="text-gray-800 leading-4 sm:leading-5"
                              style={{ opacity: 0.8 }}
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="h-full w-full bg-white flex items-center justify-center p-2 sm:p-4">
                        <div className="w-full max-w-xs">
                          <div className="text-sm sm:text-lg text-center text-gray-900 mb-3 sm:mb-6 font-semibold">
                            CalorieTracker
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            {/* Camera Preview */}
                            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                              <div className="flex items-center justify-center mb-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-400 text-2xl">
                                    📷
                                  </span>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                  Take a photo of your food
                                </p>
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-xs text-blue-500">
                                    Analyzing...
                                  </span>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-gray-200 rounded-full h-2 mb-4">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: "45%" }}
                              ></div>
                            </div>
                            <div className="text-center mb-4">
                              <span className="text-xs sm:text-sm text-gray-600">
                                900 / 2,000 cal
                              </span>
                            </div>

                            {/* Meal 1 */}
                            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                                  <span className="text-orange-600 text-lg">
                                    🍕
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                                      Pizza Margherita
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      Just now
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-xs text-red-500 font-medium">
                                      285 cal
                                    </span>
                                    <div className="flex space-x-2 text-xs text-gray-500">
                                      <span>P: 12g</span>
                                      <span>C: 35g</span>
                                      <span>F: 8g</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar */}
                  <div className="flex-none h-10 sm:h-16 border-t bg-white flex items-center justify-center">
                    <div className="w-20 sm:w-32 h-1 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Power Button */}
              <div className="absolute right-[-2px] top-[100px] sm:top-[120px] w-[3px] h-[25px] sm:h-[30px] bg-neutral-800 rounded-l-sm" />

              {/* Volume Buttons */}
              <div className="absolute left-[-2px] top-[85px] sm:top-[100px] w-[3px] h-[25px] sm:h-[30px] bg-neutral-800 rounded-r-sm" />
              <div className="absolute left-[-2px] top-[120px] sm:top-[140px] w-[3px] h-[50px] sm:h-[60px] bg-neutral-800 rounded-r-sm" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
