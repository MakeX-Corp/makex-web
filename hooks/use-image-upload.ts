"use client";

import { useState, ChangeEvent, useRef, DragEvent, useEffect } from "react";

export function useImageUpload() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);

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

  // Convert clipboard items to files
  const handleClipboardItems = async (items: DataTransferItemList) => {
    let hasProcessedImage = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Handle image items
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) {
          const filesArray = [blob];
          await processFiles(filesArray);
          hasProcessedImage = true;
        }
      }
    }

    // If we processed an image, prevent default paste behavior
    return hasProcessedImage;
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

  // Improved drag events handlers with counter
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy"; // Shows the user a copy cursor
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      processFiles(filesArray);
    }
  };

  // Clipboard paste handler
  const handlePaste = async (e: ClipboardEvent) => {
    let hasImage = false;

    if (e.clipboardData) {
      // Check if there are any image items in the clipboard
      if (e.clipboardData.items && e.clipboardData.items.length > 0) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          if (e.clipboardData.items[i].type.startsWith("image/")) {
            hasImage = true;
            break;
          }
        }
      }

      // If there's an image in the clipboard, prevent default behavior immediately
      // This will stop any text from being pasted alongside the image
      if (hasImage) {
        e.preventDefault();

        // Handle clipboard files if any
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
          const filesArray = Array.from(e.clipboardData.files);
          await processFiles(filesArray);
          return;
        }

        // Handle clipboard items (for Chrome, Edge, Safari)
        if (e.clipboardData.items && e.clipboardData.items.length > 0) {
          await handleClipboardItems(e.clipboardData.items);
          return;
        }
      }
    }
  };

  // Set up paste event listener
  useEffect(() => {
    const pasteHandler = (e: ClipboardEvent) => handlePaste(e);
    document.addEventListener("paste", pasteHandler);

    return () => {
      document.removeEventListener("paste", pasteHandler);
    };
  }, []);

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
