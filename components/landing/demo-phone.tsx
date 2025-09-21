"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { DEMO_PROMPT, REALISTIC_CODE_DEMO, ANIMATION_TIMINGS } from "@/const";

interface DemoPhoneProps {
  className?: string;
}

export function DemoPhone({ className }: DemoPhoneProps) {
  const [step, setStep] = useState(0);
  const [userPrompt, setUserPrompt] = useState("");
  const [generatingCode, setGeneratingCode] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const startGeneration = useCallback(() => {
    setStep(1);

    const repeatedCode = Array(5).fill(REALISTIC_CODE_DEMO).flat();
    setGeneratingCode(repeatedCode);

    setTimeout(() => {
      setStep(2);
      setTimeout(() => {
        setStep(0);
        setUserPrompt("");
        simulateTyping();
      }, 5000);
    }, 4000);
  }, []);

  const simulateTyping = useCallback(() => {
    if (isTyping) return;

    setIsTyping(true);
    setUserPrompt("");

    setTimeout(() => {
      let i = 0;
      const typingInterval = setInterval(() => {
        setUserPrompt(DEMO_PROMPT.slice(0, i + 1));
        i++;
        if (i === DEMO_PROMPT.length) {
          clearInterval(typingInterval);
          setIsTyping(false);
          setTimeout(() => {
            startGeneration();
          }, 500);
        }
      }, ANIMATION_TIMINGS.TYPING_SPEED);

      return () => clearInterval(typingInterval);
    }, ANIMATION_TIMINGS.TYPING_INITIAL_DELAY);
  }, [isTyping, startGeneration]);

  useEffect(() => {
    simulateTyping();
  }, []);
  return (
    <div
      className={`relative mx-auto animate-float-slow scale-110 md:scale-125 ${
        className || ""
      }`}
    >
      <div className="relative w-[280px] sm:w-[320px] h-[570px] sm:h-[650px] rounded-[44px] bg-black p-[10px] sm:p-[12px] shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[20px] sm:h-[25px] w-[120px] sm:w-[150px] bg-black rounded-b-[14px] z-20" />

        <div className="relative h-full w-full rounded-[28px] sm:rounded-[32px] overflow-hidden bg-white">
          <div className="flex h-full flex-col">
            <div className="flex-none h-10 sm:h-14 bg-white border-b flex items-center justify-between px-3 sm:px-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  MakeX
                </span>
              </div>
            </div>

            <div className="flex-grow overflow-hidden p-2 sm:p-4">
              {step === 0 && (
                <InitialStep
                  userPrompt={userPrompt}
                  isTyping={isTyping}
                  onSimulateTyping={simulateTyping}
                />
              )}

              {step === 1 && (
                <CodeGenerationStep generatingCode={generatingCode} />
              )}

              {step === 2 && <CalorieTrackerDemo />}
            </div>

            {/* Bottom indicator */}
            <div className="flex-none h-10 sm:h-16 border-t bg-white flex items-center justify-center">
              <div className="w-20 sm:w-32 h-1 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="absolute right-[-2px] top-[100px] sm:top-[120px] w-[3px] h-[25px] sm:h-[30px] bg-neutral-800 rounded-l-sm" />
        <div className="absolute left-[-2px] top-[85px] sm:top-[100px] w-[3px] h-[25px] sm:h-[30px] bg-neutral-800 rounded-r-sm" />
        <div className="absolute left-[-2px] top-[120px] sm:top-[140px] w-[3px] h-[50px] sm:h-[60px] bg-neutral-800 rounded-r-sm" />
      </div>
    </div>
  );
}

function InitialStep({
  userPrompt,
  isTyping,
  onSimulateTyping,
}: {
  userPrompt: string;
  isTyping: boolean;
  onSimulateTyping: () => void;
}) {
  return (
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
        onClick={onSimulateTyping}
        disabled={isTyping}
        className="w-full bg-primary text-white rounded-xl py-2 sm:py-3 font-medium disabled:opacity-50 text-xs sm:text-sm"
      >
        {isTyping ? "Typing..." : "Generate App →"}
      </button>
    </div>
  );
}

function CodeGenerationStep({ generatingCode }: { generatingCode: string[] }) {
  return (
    <div className="h-full w-full bg-white overflow-hidden">
      <div
        className="h-full font-mono text-[10px] sm:text-xs whitespace-pre animate-scroll-up"
        style={{ willChange: "transform" }}
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
  );
}

function CalorieTrackerDemo() {
  return (
    <div className="h-full w-full bg-white flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-xs">
        <div className="text-sm sm:text-lg text-center text-gray-900 mb-3 sm:mb-6 font-semibold">
          CalorieTracker
        </div>
        <div className="space-y-2 sm:space-y-3">
          {/* Camera section */}
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="flex items-center justify-center mb-3">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-2xl">📷</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                Take a photo of your food
              </p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xs text-blue-500">Analyzing...</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

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

          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-lg">🍕</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    Pizza Margherita
                  </span>
                  <span className="text-xs text-gray-400">Just now</span>
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
  );
}
