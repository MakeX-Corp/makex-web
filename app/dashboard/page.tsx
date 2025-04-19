// app/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

// Welcome Screen Component
const WelcomeScreen = ({
  darkMode,
  onGetStarted,
}: {
  darkMode: boolean;
  onGetStarted: () => void;
}) => {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 text-center">
      <div className="mb-8">
        <div
          className={`w-24 h-24 rounded-xl mx-auto flex items-center justify-center ${
            darkMode ? "bg-indigo-600" : "bg-indigo-500"
          } text-white font-bold text-4xl`}
        >
          B
        </div>
        <h1 className="mt-6 text-4xl font-bold">Welcome to Bolt</h1>
        <p className="mt-3 text-xl text-gray-500 dark:text-gray-400">
          Build anything with AI-powered assistance
        </p>
      </div>

      <div className="space-y-6">
        <p className="text-lg">
          First, create an app to organize your conversations around a specific
          project or topic.
        </p>
        <Button size="lg" className="px-8" onClick={onGetStarted}>
          Get Started
        </Button>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({
  darkMode,
  title,
  description,
  buttonText,
  onClick,
}: {
  darkMode: boolean;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) => {
  return (
    <div className="text-center max-w-md mx-auto py-16">
      <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
        <MessageCircle
          size={32}
          className="text-indigo-600 dark:text-indigo-400"
        />
      </div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{description}</p>
      <Button onClick={onClick}>{buttonText}</Button>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const darkMode = false; // This would ideally come from a context or state

  const handleGetStarted = () => {
    setIsFirstVisit(false);
    router.push("/testing2/create-app");
  };

  const handleCreateApp = () => {
    router.push("/testing2/create-app");
  };

  return (
    <div className="flex-1 h-full overflow-auto">
      {isFirstVisit ? (
        <WelcomeScreen darkMode={darkMode} onGetStarted={handleGetStarted} />
      ) : (
        <div className="flex-1 h-full flex items-center justify-center">
          <EmptyState
            darkMode={darkMode}
            title="No App Selected"
            description="Select an app from the sidebar or create a new one to get started."
            buttonText="Create New App"
            onClick={handleCreateApp}
          />
        </div>
      )}
    </div>
  );
}
