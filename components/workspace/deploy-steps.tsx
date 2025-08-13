"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Globe, Lock, Check, Edit } from "lucide-react";
import { useState } from "react";

interface DeployStepsProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onDeploy: (e: React.MouseEvent) => void;
  isDeploying: boolean;
}

export function DeploySteps({
  currentStep,
  setCurrentStep,
  onDeploy,
  isDeploying,
}: DeployStepsProps) {
  const [aiGenerated, setAiGenerated] = useState(false);
  const [appData, setAppData] = useState({
    category: "",
    description: "",
    tags: "",
  });

  const categories = [
    "Productivity",
    "Entertainment",
    "Education",
    "Social",
    "Business",
    "Health",
    "Finance",
    "Travel",
  ];

  const steps = [
    { id: 1, title: "Choose", description: "Setup method" },
    { id: 2, title: "Setup", description: "App details" },
    { id: 3, title: "Icon", description: "App icon" },
    { id: 4, title: "Deploy", description: "Final step" },
  ];

  const handleAIGeneration = () => {
    // Simulate AI generation
    const generatedData = {
      category: "Productivity",
      description:
        "An AI-powered task management app that helps you organize your work and boost productivity with intelligent suggestions and automated workflows.",
      tags: "productivity, task-management, ai, automation, workflow",
    };

    setAppData(generatedData);
    setAiGenerated(true);
    setCurrentStep(2);
  };

  const handleManualSetup = () => {
    setAiGenerated(false);
    setCurrentStep(2);
  };

  const handleAIIconGeneration = () => {
    setCurrentStep(4);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Create Your App</h3>
              <p className="text-sm text-muted-foreground">
                Choose how to set up your app
              </p>
            </div>

            <Button
              onClick={handleAIGeneration}
              className="w-full h-12"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Everything with AI
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              AI will generate category, description, and tags
            </div>

            <div className="text-center">
              <span className="text-sm font-medium text-muted-foreground">
                Or set up manually:
              </span>
            </div>

            <Button
              onClick={handleManualSetup}
              variant="outline"
              className="w-full"
            >
              Set Up Manually
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">App Details</h3>
              {aiGenerated && (
                <Badge variant="secondary" className="text-xs">
                  AI Generated
                </Badge>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={appData.category}
                onValueChange={(value) =>
                  setAppData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your app..."
                value={appData.description}
                onChange={(e) =>
                  setAppData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Tags Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                placeholder="Enter tags separated by commas"
                value={appData.tags}
                onChange={(e) =>
                  setAppData((prev) => ({ ...prev, tags: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Example: productivity, task-management, ai
              </p>
            </div>

            {/* Show generated data if AI was used */}
            {aiGenerated && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">
                    <strong>AI Generated:</strong> You can edit any of the
                    fields above to customize the AI suggestions.
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="flex-1"
                disabled={!appData.category}
              >
                Next
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">App Icon</h3>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Category:</span>{" "}
                {appData.category}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={handleAIIconGeneration}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <Sparkles className="h-6 w-6 mx-auto text-primary" />
                  <div className="text-sm font-medium">
                    Generate Icon with AI
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setCurrentStep(4)}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <span className="text-2xl">📤</span>
                  <div className="text-sm font-medium">Upload Custom Icon</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={() => setCurrentStep(4)} className="flex-1">
                Skip Icon
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">App Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Choose who can access your app
              </p>
            </div>

            <div className="space-y-2">
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">
                        Available on app store
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">
                        Only you can access
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={onDeploy}
                disabled={isDeploying}
                className="flex-1"
              >
                {isDeploying ? "Deploying..." : "Deploy App"}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-1 text-center">
                <div
                  className={`text-xs ${
                    currentStep >= step.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </div>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`
                w-8 h-0.5 mx-2
                ${currentStep > step.id ? "bg-primary" : "bg-muted"}
              `}
              />
            )}
          </div>
        ))}
      </div>

      {renderStep()}
    </div>
  );
}
