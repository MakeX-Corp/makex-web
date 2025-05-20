"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileCode, CodeXml } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSession } from "@/context/session-context";
const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const fetchJSON = (u: string) => fetch(u).then((r) => r.json());

export default function CodeEditor({
  file,
}: {
  file: { path: string; language: string } | null;
}) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { apiUrl } = useSession();
  // Ensure we have access to the theme after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, error, isLoading } = useSWR<{ code: string }>(
    file
      ? `/api/file?path=${encodeURIComponent(file.path)}&api_url=${apiUrl}`
      : null,
    fetchJSON
  );

  // Get file name from path if available
  const fileName = file?.path ? file.path.split("/").pop() : "";

  // Choose a theme based on the system/user preference
  const editorTheme = !mounted
    ? "vs-dark"
    : theme === "dark"
    ? "vs-dark"
    : "vs-light";

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

  return (
    <div className="h-full flex flex-col">
      {/* File header */}
      <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center">
        <div className="text-sm font-medium truncate">{fileName}</div>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 relative">
        <Monaco
          key={file.path}
          language={file.language}
          value={data!.code}
          theme={editorTheme}
          options={{
            readOnly: true,
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
