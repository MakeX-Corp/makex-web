"use client";

import { useState, useEffect } from "react";
import FileTree from "@/components/workspace/code-view/file-tree";
import CodeEditor from "@/components/workspace/code-view/code-editor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { FolderTree } from "lucide-react";

export default function CodeView() {
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    language: string;
  } | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [fileTreeKey, setFileTreeKey] = useState(0); // Force re-render of file tree

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Handle file selection
  const handleFileSelect = (file: { path: string; language: string }) => {
    setSelectedFile(file);
  };

  // Handle file tree refresh
  const handleFileTreeRefresh = () => {
    setFileTreeKey((prev) => prev + 1);
    // Clear selected file if it was deleted
    setSelectedFile(null);
  };

  // Different styling for mobile vs desktop
  const containerStyle = isMobile
    ? {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
      }
    : {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
        maxHeight: "calc(100vh - 200px)",
      };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--muted)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <FolderTree
          style={{ height: "16px", width: "16px", marginRight: "8px" }}
        />
        <span>Explorer</span>
      </div>

      {/* Main content with ResizablePanelGroup */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: isMobile ? "none" : "calc(100vh - 250px)",
          overflow: "hidden",
        }}
      >
        <ResizablePanelGroup
          direction="horizontal"
          style={{ height: "100%", width: "100%" }}
        >
          {/* File tree sidebar */}
          <ResizablePanel
            defaultSize={25}
            minSize={15}
            style={{
              borderRight: "1px solid var(--border)",
              backgroundColor: "var(--muted-40)",
              overflow: "auto",
              maxHeight: "100%",
            }}
          >
            <FileTree
              key={fileTreeKey}
              onSelect={handleFileSelect}
              selectedPath={selectedFile?.path ?? null}
              onFileTreeChange={handleFileTreeRefresh}
            />
          </ResizablePanel>

          {/* Resizable handle */}
          <ResizableHandle withHandle />

          {/* Code editor */}
          <ResizablePanel
            defaultSize={75}
            style={{ overflow: "auto", maxHeight: "100%" }}
          >
            <div style={{ height: "100%", overflow: "auto" }}>
              <CodeEditor file={selectedFile} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
