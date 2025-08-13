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
import { Sparkles, Globe, Lock, Check, Edit, X } from "lucide-react";
import { useState, useRef } from "react";

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
  const [selectedVisibility, setSelectedVisibility] = useState<
    "public" | "private"
  >("public");
  const [customIcon, setCustomIcon] = useState<string>("");
  const [iconError, setIconError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setCustomIcon(""); // Clear custom icon
    setAiGenerated(true); // Set AI as selected
    setCurrentStep(4);
  };

  const handleAIDetailsGeneration = () => {
    // Don't fill in the form fields, just mark as AI selected
    setAiGenerated(true);
  };

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setIconError("");

    // Check file type
    if (!file.type.startsWith("image/")) {
      setIconError("Please select a valid image file");
      return;
    }

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setIconError("Image size must be less than 1MB");
      return;
    }

    // Create a FileReader to convert to base64
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Check dimensions
        if (img.width > 256 || img.height > 256) {
          setIconError("Image dimensions must be 256x256 or smaller");
          return;
        }

        // Convert to base64
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        try {
          const base64 = canvas.toDataURL("image/png", 0.8);
          setCustomIcon(base64);
          setAiGenerated(false); // Clear AI selection
          setIconError(""); // Clear any previous errors
        } catch (error) {
          setIconError("Failed to process image");
        }
      };

      img.onerror = () => {
        setIconError("Failed to load image");
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };

    reader.onerror = () => {
      setIconError("Failed to read file");
    };

    reader.readAsDataURL(file);
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAppData((prev) => ({ ...prev, tags: value }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currentTags = appData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      if (currentTags.length < 5 && appData.tags.trim()) {
        const newTag = appData.tags.trim();
        if (newTag && !currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag].join(", ");
          setAppData((prev) => ({ ...prev, tags: updatedTags }));
        }
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = appData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    const updatedTags = currentTags
      .filter((tag) => tag !== tagToRemove)
      .join(", ");
    setAppData((prev) => ({ ...prev, tags: updatedTags }));
  };

  const getTagsArray = () => {
    return appData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
  };

  const isFormValid = () => {
    const tagsArray = getTagsArray();
    return (
      appData.category &&
      appData.description.trim() &&
      appData.description.length <= 100 &&
      tagsArray.length > 0 &&
      tagsArray.length <= 5
    );
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

            {/* AI Generation Option */}
            <Button
              onClick={handleAIDetailsGeneration}
              className={`w-full ${
                aiGenerated ? "bg-primary text-primary-foreground" : ""
              }`}
              variant={aiGenerated ? "default" : "outline"}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {aiGenerated
                ? "AI Generation Selected"
                : "Generate Details with AI"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              AI will generate category, description, and tags
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or fill manually
                </span>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={appData.category}
                onValueChange={(value) =>
                  setAppData((prev) => ({ ...prev, category: value }))
                }
                disabled={aiGenerated}
              >
                <SelectTrigger
                  className={aiGenerated ? "opacity-50 cursor-not-allowed" : ""}
                >
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
                maxLength={100}
                disabled={aiGenerated}
                className={aiGenerated ? "opacity-50 cursor-not-allowed" : ""}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Max 100 characters</span>
                <span>{appData.description.length}/100</span>
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                placeholder="Enter tags separated by commas (max 5)"
                value={appData.tags}
                onChange={handleTagInput}
                onKeyDown={handleTagKeyDown}
                disabled={aiGenerated}
                className={aiGenerated ? "opacity-50 cursor-not-allowed" : ""}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Separate tags with commas</span>
                <span>{getTagsArray().length}/5</span>
              </div>

              {/* Display Tags */}
              {getTagsArray().length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getTagsArray().map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        disabled={aiGenerated}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Show generated data if AI was used */}
            {aiGenerated && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">
                    <strong>AI Generation Selected:</strong> The form fields
                    above will be filled automatically when you deploy.
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
                disabled={!isFormValid() && !aiGenerated}
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
                className={`cursor-pointer transition-colors ${
                  aiGenerated
                    ? "border-primary bg-primary/5 hover:border-primary/70"
                    : "hover:border-primary/50"
                }`}
                onClick={handleAIIconGeneration}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <Sparkles
                    className={`h-6 w-6 mx-auto ${
                      aiGenerated ? "text-primary" : "text-primary"
                    }`}
                  />
                  <div className="text-sm font-medium">
                    {aiGenerated
                      ? "AI Icon Generation Selected"
                      : "Generate Icon with AI"}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors ${
                  customIcon
                    ? "border-primary bg-primary/5 hover:border-primary/70"
                    : "hover:border-primary/50"
                }`}
                onClick={() => {
                  if (!customIcon) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <svg
                    className="h-6 w-6 mx-auto text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div className="text-sm font-medium">
                    {customIcon ? "Custom Icon Selected" : "Upload Custom Icon"}
                  </div>

                  {!customIcon && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomIconUpload}
                        className="hidden"
                        ref={fileInputRef}
                      />
                    </>
                  )}

                  {/* Show icon preview */}
                  {customIcon && (
                    <div className="pt-2">
                      <img
                        src={customIcon}
                        alt="Custom icon"
                        className="h-16 w-16 mx-auto rounded-lg object-cover border-2 border-primary/20"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Error message */}
            {iconError && (
              <div className="text-sm text-red-500 text-center">
                {iconError}
              </div>
            )}

            {/* Requirements info */}
            <div className="text-xs text-muted-foreground text-center">
              <p>Max dimensions: 256x256 pixels</p>
              <p>Max file size: 1MB</p>
              <p>Supported formats: PNG, JPG, GIF</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="flex-1"
                disabled={!aiGenerated && !customIcon}
              >
                Next
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
              <Card
                className={`cursor-pointer transition-colors ${
                  selectedVisibility === "public"
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedVisibility("public")}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">
                        Available on our app store
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors ${
                  selectedVisibility === "private"
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedVisibility("private")}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">
                        Only people with the link can access
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
