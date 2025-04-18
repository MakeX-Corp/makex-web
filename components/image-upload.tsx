"use client";

import { Button } from "@/components/ui/button";
import { Image as ImageIcon, X } from "lucide-react";
import { useRef, ChangeEvent } from "react";

interface ImageUploadProps {
  imagePreview: string | null;
  onImageSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  disabled: boolean;
}

export function ImageUpload({
  imagePreview,
  onImageSelect,
  onRemoveImage,
  disabled,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Image preview area */}
      {imagePreview && (
        <div className="mb-3 relative">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 rounded-md object-cover border border-border"
            />
            <button
              onClick={onRemoveImage}
              className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 hover:bg-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* File input for image (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={onImageSelect}
        disabled={disabled}
      />

      {/* Image upload button */}
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title="Upload an image"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </>
  );
}
