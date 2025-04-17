"use client";

import { useState, ChangeEvent, useRef, DragEvent } from "react";

export function useImageUpload() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Resize and optimize image while preserving transparency
  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Max dimensions (reduce to save bandwidth)
          const maxWidth = 800;
          const maxHeight = 800;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions if needed
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Don't fill with white background to preserve transparency
            ctx.clearRect(0, 0, width, height);

            // Draw the image directly
            ctx.drawImage(img, 0, 0, width, height);

            // Use PNG format to preserve transparency
            const optimizedBase64 = canvas.toDataURL("image/png", 0.9);
            resolve(optimizedBase64);
          } else {
            // Fallback if canvas context isn't available
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Process multiple files with optimization
  const processFiles = async (files: File[]) => {
    // Filter to only include images
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) return;

    // Add to existing selection
    setSelectedImages((prev) => [...prev, ...imageFiles]);

    // Create optimized previews
    for (const file of imageFiles) {
      try {
        const optimizedImage = await optimizeImage(file);
        setImagePreviews((prev) => [...prev, optimizedImage]);
      } catch (err) {
        console.error("Error processing image:", err);
      }
    }
  };

  // Handle image selection from file input
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      processFiles(filesArray);
    }
  };

  // Remove a specific image by index
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove all selected images
  const resetImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag events handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      processFiles(filesArray);
    }
  };

  return {
    selectedImages,
    imagePreviews,
    isDragging,
    handleImageSelect,
    handleRemoveImage,
    resetImages,
    fileInputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
