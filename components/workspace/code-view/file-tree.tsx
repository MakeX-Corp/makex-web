"use client";

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useSession } from "@/context/session-context";
import { useToast } from "@/hooks/use-toast";
import FileItem from "./file-item";
import FolderItem from "./folder-item";
import { Node, fetchJSON } from "./utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const [createName, setCreateName] = useState("");

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

  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    if (!folderName.trim()) return;
    const fullPath =
      parentPath === "/" ? `/${folderName}` : `${parentPath}/${folderName}`;
    try {
      const response = await fetch("/api/code/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl,
          path: fullPath,
          isFolder: true,
        }),
      });
      if (response.ok) {
        mutate();
        onFileTreeChange?.();
        toast({
          title: "Folder Created",
          description: `Successfully created ${folderName}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create folder",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder",
      });
    }
  };

  const handleDeleteFile = async (filePath: string, isFolder = false) => {
    const fileName = filePath.split("/").pop() || "file";
    try {
      const response = await fetch("/api/code/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl,
          path: filePath,
          operation: "delete",
          isFolder,
        }),
      });
      if (response.ok) {
        mutate();
        onFileTreeChange?.();
        toast({
          title: isFolder ? "Folder Deleted" : "File Deleted",
          description: `Successfully deleted ${fileName}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to delete ${isFolder ? "folder" : "file"}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete ${isFolder ? "folder" : "file"}`,
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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Create file or folder"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!createName.trim()) return;
                if (createType === "file") {
                  handleCreateFile("/", createName.trim());
                } else {
                  handleCreateFolder("/", createName.trim());
                }
                setCreateDialogOpen(false);
                setCreateName("");
                setCreateType("file");
              }}
              className="space-y-4"
            >
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={createType === "file" ? "default" : "outline"}
                  onClick={() => setCreateType("file")}
                  className={createType === "file" ? "" : "bg-background"}
                >
                  File
                </Button>
                <Button
                  type="button"
                  variant={createType === "folder" ? "default" : "outline"}
                  onClick={() => setCreateType("folder")}
                  className={createType === "folder" ? "" : "bg-background"}
                >
                  Folder
                </Button>
              </div>
              <div>
                <label htmlFor="createName" className="text-sm font-medium">
                  {createType === "file" ? "File Name" : "Folder Name"}
                </label>
                <Input
                  id="createName"
                  name="createName"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={
                    createType === "file"
                      ? "Enter file name (e.g., index.tsx)"
                      : "Enter folder name (e.g., new-folder)"
                  }
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setCreateName("");
                    setCreateType("file");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!createName.trim()}>
                  Create {createType === "file" ? "File" : "Folder"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                onCreateFolder={handleCreateFolder}
                onDelete={(path) => handleDeleteFile(path, true)}
                apiUrl={apiUrl}
              />
            )
          )}
        </ul>
      </div>
    </div>
  );
}
