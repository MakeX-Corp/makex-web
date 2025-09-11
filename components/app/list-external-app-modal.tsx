"use client";
import { useState } from "react";
import { ExternalLink, Loader2, Sparkles, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { APP_CATEGORIES } from "@/const";

interface ListExternalAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListExternalAppModal({
  open,
  onOpenChange,
}: ListExternalAppModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  // App details state
  const [aiGeneratedDetails, setAiGeneratedDetails] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Icon state
  const [aiGeneratedIcon, setAiGeneratedIcon] = useState(true);
  const [customIcon, setCustomIcon] = useState("");
  const [iconError, setIconError] = useState("");

  const handleUrlSubmit = () => {
    if (!importUrl.trim()) {
      setImportError("Please enter a valid URL");
      return;
    }

    try {
      new URL(importUrl);
    } catch {
      setImportError("Please enter a valid URL format");
      return;
    }

    setImportError("");
    setCurrentStep(2);
  };

  const handleAIGeneration = () => {
    setAiGeneratedDetails(true);
    // Clear all inputs when AI is selected
    setCategory("");
    setDescription("");
    setTags("");
    setCurrentStep(3);
  };

  const handleManualSetup = () => {
    setAiGeneratedDetails(false);
    setCurrentStep(3);
  };

  const getTagsArray = () => {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
  };

  const isFormValid = () => {
    const tagsArray = getTagsArray();
    return (
      category &&
      description.trim() &&
      description.length <= 100 &&
      tagsArray.length > 0 &&
      tagsArray.length <= 5
    );
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const deployData = {
        category,
        description,
        tags: getTagsArray(),
        icon: customIcon || "ai-generated",
        isPublic,
        aiGeneratedDetails,
        aiGeneratedIcon,
        importUrl,
      };

      const response = await fetch("/api/code/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: null,
          type: "external",
          deployData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Listing failed (${response.status})`,
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown listing error");
      }

      handleClose();
      console.log("External app listed successfully:", data);
    } catch (error: any) {
      console.error("Error listing external app:", error);
      setImportError(error.message || "Failed to list external app");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(1);
    setImportUrl("");
    setImportError("");
    setCategory("");
    setDescription("");
    setTags("");
    setIsPublic(true);
    setAiGeneratedDetails(false);
    setAiGeneratedIcon(true);
    setCustomIcon("");
    setIconError("");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">List External App</h3>
              <p className="text-sm text-muted-foreground">
                Enter the URL of an external app to list in the app catalog
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">App URL</label>
                <Input
                  placeholder="https://example.com"
                  value={importUrl}
                  onChange={(e) => {
                    setImportUrl(e.target.value);
                    setImportError("");
                  }}
                  className={importError ? "border-red-500" : ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUrlSubmit();
                    }
                  }}
                />
                {importError && (
                  <div className="text-sm text-red-500">{importError}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  This will create a listing that links to the external app
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!importUrl.trim()}>
                Continue
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Setup Method</h3>
              <p className="text-sm text-muted-foreground">
                Choose how to set up your app listing
              </p>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                External URL: {importUrl}
              </div>
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

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">App Details</h3>
              {aiGeneratedDetails && (
                <Badge variant="secondary" className="text-xs">
                  AI Generated
                </Badge>
              )}
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                External URL: {importUrl}
              </div>
            </div>

            {aiGeneratedDetails && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">
                    <strong>AI Generation Selected:</strong> The form fields
                    below will be filled automatically when you submit.
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={aiGeneratedDetails}
                >
                  <SelectTrigger
                    className={
                      aiGeneratedDetails ? "opacity-50 cursor-not-allowed" : ""
                    }
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your app..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={100}
                  disabled={aiGeneratedDetails}
                  className={
                    aiGeneratedDetails ? "opacity-50 cursor-not-allowed" : ""
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Max 100 characters</span>
                  <span>{description.length}/100</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <Input
                  placeholder="Enter tags separated by commas (max 5)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={aiGeneratedDetails}
                  className={
                    aiGeneratedDetails ? "opacity-50 cursor-not-allowed" : ""
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Separate tags with commas</span>
                  <span>{getTagsArray().length}/5</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={!isFormValid() && !aiGeneratedDetails}
              >
                Next
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">App Icon</h3>
              <p className="text-sm text-muted-foreground">
                Choose how to generate your app icon
              </p>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                External URL: {importUrl}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-colors ${
                  aiGeneratedIcon
                    ? "border-primary bg-primary/5 hover:border-primary/70"
                    : "hover:border-primary/50"
                }`}
                onClick={() => {
                  setAiGeneratedIcon(true);
                  setCustomIcon("");
                  setIconError("");
                }}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <Sparkles
                    className={`h-6 w-6 mx-auto ${
                      aiGeneratedIcon ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div className="text-sm font-medium">
                    {aiGeneratedIcon
                      ? "AI Icon Selected"
                      : "Generate Icon with AI"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AI will create an icon based on your app details
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
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;

                    setIconError("");

                    if (!file.type.startsWith("image/")) {
                      setIconError("Please select a valid image file");
                      return;
                    }

                    if (file.size > 1024 * 1024) {
                      setIconError("Image size must be less than 1MB");
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        if (img.width > 256 || img.height > 256) {
                          setIconError(
                            "Image dimensions must be 256x256 or smaller",
                          );
                          return;
                        }

                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);

                        try {
                          const base64 = canvas.toDataURL("image/png", 0.8);
                          setCustomIcon(base64);
                          setAiGeneratedIcon(false);
                          setIconError("");
                        } catch (error) {
                          setIconError("Failed to process image");
                        }
                      };
                      img.onerror = () => setIconError("Failed to load image");
                      if (event.target?.result) {
                        img.src = event.target.result as string;
                      }
                    };
                    reader.onerror = () => setIconError("Failed to read file");
                    reader.readAsDataURL(file);
                  };
                  input.click();
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

            {iconError && (
              <div className="text-sm text-red-500 text-center">
                {iconError}
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Max dimensions: 256x256 pixels</p>
              <p>Max file size: 1MB</p>
              <p>Supported formats: PNG, JPG, GIF</p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(5)}>Next</Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">App Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Choose who can access your app listing
              </p>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                External URL: {importUrl}
              </div>
            </div>

            <div className="space-y-3">
              <Card
                className={`cursor-pointer transition-colors ${
                  isPublic
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setIsPublic(true)}
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
                  !isPublic
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setIsPublic(false)}
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

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
                Back
              </Button>
              <Button onClick={handleDeploy} disabled={isDeploying}>
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  "Create Listing"
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">List External App</DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
