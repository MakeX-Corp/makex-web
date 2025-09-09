import {
  FileJson,
  FileCode,
  FileImage,
  FileArchive,
  FileCog,
  FileSpreadsheet,
  FileTerminal,
  FileText,
} from "lucide-react";

export const getFileIcon = (name: string) => {
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

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export type Node =
  | { type: "file"; name: string; path: string; language: string; size: number }
  | { type: "folder"; name: string; path: string };

export const fetchJSON = (u: string) => fetch(u).then((r) => r.json());
