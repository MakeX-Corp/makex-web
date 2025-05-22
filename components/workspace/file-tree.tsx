"use client";

import { useState } from "react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FileJson,
  FileCode,
  FileImage,
  FileArchive,
  FileCog,
  FileSpreadsheet,
  FileTerminal,
  AlertCircle,
} from "lucide-react";
import { useSession } from "@/context/session-context";
type Node =
  | { type: "file"; name: string; path: string; language: string; size: number }
  | { type: "folder"; name: string; path: string };

const fetchJSON = (u: string) => fetch(u).then((r) => r.json());

export default function FileTree({
  onSelect,
  selectedPath,
}: {
  onSelect: (f: { path: string; language: string }) => void;
  selectedPath?: string | null;
}) {
  const { apiUrl } = useSession();
  const {
    data: root,
    error,
    isLoading,
  } = useSWR<Node[]>(`/api/files?path=/&api_url=${apiUrl}`, fetchJSON);

  if (isLoading || !root)
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );

  if (error)
    return (
      <div className="px-4 py-3 text-sm flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load files</span>
      </div>
    );

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="py-2">
        <h3 className="px-4 text-sm font-medium text-foreground mb-2">
          Project Files
        </h3>
        <ul className="pl-2 text-muted-foreground text-sm font-mono">
          {root!.map((n) =>
            n.type === "file" ? (
              <FileItem
                key={n.path}
                node={n}
                active={selectedPath === n.path}
                onSelect={onSelect}
              />
            ) : (
              <FolderItem
                key={n.path}
                node={n}
                activePath={selectedPath}
                onSelect={onSelect}
                apiUrl={apiUrl}
              />
            )
          )}
        </ul>
      </div>
    </div>
  );
}

/* ------------ helpers ------------ */

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "json":
      return <FileJson className="h-4 w-4 flex-none" />;
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return <FileCode className="h-4 w-4 flex-none" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return <FileImage className="h-4 w-4 flex-none" />;
    case "zip":
    case "rar":
    case "tar":
    case "gz":
      return <FileArchive className="h-4 w-4 flex-none" />;
    case "yml":
    case "yaml":
    case "config":
      return <FileCog className="h-4 w-4 flex-none" />;
    case "csv":
    case "xlsx":
      return <FileSpreadsheet className="h-4 w-4 flex-none" />;
    case "sh":
    case "bash":
      return <FileTerminal className="h-4 w-4 flex-none" />;
    default:
      return <FileText className="h-4 w-4 flex-none" />;
  }
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ------------- items ------------- */

function FileItem({
  node,
  active,
  onSelect,
}: {
  node: Extract<Node, { type: "file" }>;
  active?: boolean;
  onSelect: (f: { path: string; language: string }) => void;
}) {
  return (
    <li>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                onSelect({ path: node.path, language: node.language })
              }
              className={cn(
                "flex w-full items-center gap-2 px-2 py-1 rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground font-medium"
              )}
            >
              {getFileIcon(node.name)}
              <span className="truncate">{node.name}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{node.path}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(node.size)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </li>
  );
}

function FolderItem({
  node,
  activePath,
  onSelect,
  apiUrl,
}: {
  node: Extract<Node, { type: "folder" }>;
  activePath?: string | null;
  onSelect: (f: { path: string; language: string }) => void;
  apiUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: children = [], isLoading } = useSWR<Node[]>(
    open ? `/api/files?path=${encodeURIComponent(node.path)}&api_url=${apiUrl}` : null,
    fetchJSON,
    { refreshInterval: 5000 }
  );

  return (
    <li className="py-0.5">
      <div
        className={cn(
          "flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-colors"
        )}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 flex-none" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-none" />
        )}
        {open ? (
          <FolderOpen className="h-4 w-4 flex-none text-black dark:text-white" />
        ) : (
          <Folder className="h-4 w-4 flex-none text-black dark:text-white" />
        )}
        <span>{node.name}</span>
      </div>

      {open && (
        <ul className="ml-5 mt-1 space-y-0.5">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-4/5 my-1" />
              <Skeleton className="h-5 w-3/4 my-1" />
            </>
          ) : children.length ? (
            children.map((n) =>
              n.type === "file" ? (
                <FileItem
                  key={n.path}
                  node={n}
                  active={activePath === n.path}
                  onSelect={onSelect}
                />
              ) : (
                <FolderItem
                  key={n.path}
                  node={n}
                  activePath={activePath}
                  onSelect={onSelect}
                  apiUrl={apiUrl}
                />
              )
            )
          ) : (
            <div className="px-2 py-1 text-xs text-muted-foreground italic">
              Empty folder
            </div>
          )}
        </ul>
      )}
    </li>
  );
}
