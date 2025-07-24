"use client";

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useSession } from "@/context/session-context";
import CreateFileDialog from "./create-file-dialog";
import { useToast } from "@/hooks/use-toast";
import FileItem from "./file-item";
import FolderItem from "./folder-item";
import { Node, fetchJSON } from "./utils";

export default function FileTree({
  onSelect,
  selectedPath,
  onFileTreeChange,
}: {
  onSelect: (f: { path: string; language: string }) => void;
  selectedPath?: string | null;
  onFileTreeChange?: () => void;
}) {
  const { apiUrl } = useSession();
  const { toast } = useToast();
  const {
    data: root,
    error,
    isLoading,
    mutate,
  } = useSWR<Node[]>(`/api/files?path=/&api_url=${apiUrl}`, fetchJSON);

  const handleCreateFile = async (parentPath: string, fileName: string) => {
    if (!fileName.trim()) return;

    const fullPath =
      parentPath === "/" ? `/${fileName}` : `${parentPath}/${fileName}`;

    try {
      const response = await fetch("/api/code/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl,
          path: fullPath,
          content: "",
        }),
      });

      if (response.ok) {
        // Refresh the file tree
        mutate();
        onFileTreeChange?.();
        toast({
          title: "File Created",
          description: `Successfully created ${fileName}`,
        });
      } else {
        console.error("Failed to create file");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create file",
        });
      }
    } catch (error) {
      console.error("Error creating file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create file",
      });
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    const fileName = filePath.split("/").pop() || "file";

    try {
      const response = await fetch("/api/code/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl,
          path: filePath,
          operation: "delete",
        }),
      });

      if (response.ok) {
        // Refresh the file tree
        mutate();
        onFileTreeChange?.();
        toast({
          title: "File Deleted",
          description: `Successfully deleted ${fileName}`,
        });
      } else {
        console.error("Failed to delete file");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete file",
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete file",
      });
    }
  };

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
        <div className="px-4 flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Project Files</h3>
          <CreateFileDialog parentPath="/" onCreateFile={handleCreateFile} />
        </div>
        <ul className="pl-2 text-muted-foreground text-sm font-mono">
          {root!.map((n) =>
            n.type === "file" ? (
              <FileItem
                key={n.path}
                node={n}
                active={selectedPath === n.path}
                onSelect={onSelect}
                onDelete={handleDeleteFile}
              />
            ) : (
              <FolderItem
                key={n.path}
                node={n}
                activePath={selectedPath}
                onSelect={onSelect}
                onCreateFile={handleCreateFile}
                onDelete={handleDeleteFile}
                apiUrl={apiUrl}
              />
            )
          )}
        </ul>
      </div>
    </div>
  );
}
