"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileCode, CodeXml, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ANIMATION_TIMINGS } from "@/const";
import { useSession } from "@/context/session-context";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const fetchJSON = (u: string) => fetch(u).then((r) => r.json());

// Language detection based on file extension
function detectLanguage(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase() || "";

  const languageMap: { [key: string]: string } = {
    // Web
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "scss",
    json: "json",

    // Markup
    md: "markdown",
    markdown: "markdown",
    mdx: "markdown",

    // Images
    png: "image",
    jpg: "image",
    jpeg: "image",
    gif: "image",
    svg: "image",
    webp: "image",
    ico: "image",

    // Python
    py: "python",
    pyw: "python",

    // Java
    java: "java",
    class: "java",

    // C/C++
    c: "c",
    cpp: "cpp",
    h: "cpp",
    hpp: "cpp",

    // Shell
    sh: "shell",
    bash: "shell",
    zsh: "shell",

    // Other common languages
    txt: "plaintext",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    sql: "sql",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
  };

  return languageMap[extension] || "plaintext";
}

// Image viewer component
interface BinaryImageData {
  type: "binary";
  mime_type: string;
  data: string;
  code: string;
}

function ImageViewer({ src }: { src: BinaryImageData }) {
  const imageSrc = `data:${src.mime_type};base64,${src.data}`;

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="relative w-full h-full max-w-4xl max-h-[calc(100vh-200px)] flex items-center justify-center">
        <img
          src={imageSrc}
          alt="File preview"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </div>
    </div>
  );
}

export default function CodeEditor({
  file,
}: {
  file: { path: string; language?: string } | null;
}) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { appId } = useSession();

  // Detect language if not provided
  const detectedLanguage = file
    ? file.language || detectLanguage(file.path)
    : "";

  const { data, error, isLoading } = useSWR<BinaryImageData>(
    file
      ? `/api/code/file?path=${encodeURIComponent(file.path)}&appId=${appId}`
      : null,
    fetchJSON,
  );

  // Get file name from path if available
  const fileName = file?.path ? file.path.split("/").pop() : "";

  // Choose a theme based on the system/user preference
  const editorTheme = !mounted
    ? "vs-dark"
    : theme === "dark"
    ? "vs-dark"
    : "vs-light";

  // Ensure we have access to the theme after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track code in state for editing (non-image files)
  const [code, setCode] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<
    null | "success" | "error" | "saving"
  >(null);

  // Update code state when file or data changes
  useEffect(() => {
    if (data && data.code !== undefined) {
      setCode(data.code);
    }
  }, [data, file]);

  // Save handler
  const handleSave = async () => {
    if (!file) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/code/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: file.path,
          content: code,
          appId: appId,
        }),
      });
      if (res.ok) {
        setSaveStatus("success");
        setTimeout(
          () => setSaveStatus(null),
          ANIMATION_TIMINGS.SAVE_STATUS_TIMEOUT,
        );
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  if (!file)
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground p-8">
        <FileCode className="h-16 w-16 text-muted-foreground/30" />
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No File Selected</h3>
          <p className="text-sm max-w-md">
            Select a file from the tree view on the left to start browsing code.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled className="mt-4">
          <CodeXml className="h-4 w-4 mr-2" />
          Select a file to view
        </Button>
      </div>
    );

  if (isLoading)
    return (
      <div className="p-6 space-y-6 h-full">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-60" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2 mt-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading file</AlertTitle>
          <AlertDescription>
            The file type is not supported or the file could not be loaded.
          </AlertDescription>
        </Alert>
      </div>
    );

  // Handle image files
  if (detectedLanguage === "image") {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center">
          <div className="text-sm font-medium truncate">{fileName}</div>
          <div className="text-xs text-muted-foreground ml-2 px-2 py-0.5 rounded bg-muted">
            {detectedLanguage}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="ml-auto"
          ></Button>
        </div>
        {data && <ImageViewer src={data} />}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* File header */}
      <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center">
        <div className="text-sm font-medium truncate">{fileName}</div>
        <div className="text-xs text-muted-foreground ml-2 px-2 py-0.5 rounded bg-muted">
          {detectedLanguage}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "success"
            ? "Saved!"
            : "Save"}
        </Button>
      </div>

      {/* Error message */}
      {saveStatus === "error" && (
        <div className="border-b border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Failed to save file. Please try again.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSaveStatus(null)}
            className="h-6 w-6 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Monaco editor */}
      <div className="flex-1 relative">
        <Monaco
          key={file.path}
          language={detectedLanguage}
          value={code}
          theme={editorTheme}
          onChange={(v) => setCode(v ?? "")}
          options={{
            readOnly: false,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: "on",
            renderWhitespace: "boundary",
            padding: { top: 20 },
            lineNumbers: "on",
            folding: true,
            renderLineHighlight: "all",
            hideCursorInOverviewRuler: true,
            automaticLayout: true,
          }}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
