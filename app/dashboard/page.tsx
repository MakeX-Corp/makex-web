"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useApp } from "@/context/app-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_SUGGESTIONS } from "@/const";
import { SuggestionsContainer, PromptInput } from "@/components/landing";
import { ListExternalAppModal } from "@/components/app/list-external-app-modal";

export default function DashboardPage() {
  const router = useRouter();
  const { createApp } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [initialPromptLoaded, setInitialPromptLoaded] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!initialPromptLoaded) {
      const storedPrompt = localStorage.getItem("makeX_home_prompt");
      if (storedPrompt) {
        setPrompt(storedPrompt);

        localStorage.removeItem("makeX_home_prompt");

        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
      setInitialPromptLoaded(true);
    }
  }, [initialPromptLoaded]);

  const handleCreateApp = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
    setIsCreating(true);
    setCurrentStep(0);

    try {
      const steps = [
        "Setting up your files...",
        "Configuring cloud environment...",
        "Warming up AI models...",
        "Finalizing setup...",
      ];
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1000);

      localStorage.setItem("makeX_prompt", prompt);
      const redirectUrl = await createApp(prompt);
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

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl mx-auto">
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
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              What do you want to build?
            </h1>
            <Button
              variant="outline"
              onClick={() => setIsExternalModalOpen(true)}
              className="mb-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              List External App
            </Button>
            <p className="text-sm text-muted-foreground">
              Or add an existing app to the catalog
            </p>
          </div>
          <SuggestionsContainer
            onSuggestionClick={handleSuggestionClick}
            className="mb-8"
          />
          <PromptInput
            ref={inputRef}
            prompt={prompt}
            onPromptChange={setPrompt}
            onCreateApp={handleCreateApp}
            loading={isCreating}
            className="mb-8"
          />

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

        <ListExternalAppModal
          open={isExternalModalOpen}
          onOpenChange={setIsExternalModalOpen}
        />
      </div>
    </>
  );
}
