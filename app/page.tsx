"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WaitlistContainer from "@/components/waitlist-container";
import {
  HeroSection,
  SuggestionsContainer,
  PromptInput,
  DemoPhone,
  AnimatedBackground,
} from "@/components/landing";
import { APP_SUGGESTIONS } from "@/const";

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleCreateApp = () => {
    router.push("/dashboard");
  };

  const handleSuggestionClick = (suggestion: (typeof APP_SUGGESTIONS)[0]) => {
    setPrompt(suggestion.prompt);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background/95 to-background/90 overflow-hidden">
      <AnimatedBackground />

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 mt-0">
        <div className="container px-4 py-1 flex flex-col items-center text-center">
          <HeroSection />

          <div className="w-full max-w-md mb-4 md:mb-8 animate-fade-in-delay-2">
            <WaitlistContainer />
          </div>

          <div className="w-full max-w-4xl mx-auto mb-8 animate-fade-in-delay-3">
            <SuggestionsContainer
              onSuggestionClick={handleSuggestionClick}
              className="mb-8"
            />

            <PromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              onCreateApp={handleCreateApp}
              className="mb-8"
            />
          </div>

          <DemoPhone className="mb-4 md:mb-8" />
        </div>
      </main>
    </div>
  );
}
