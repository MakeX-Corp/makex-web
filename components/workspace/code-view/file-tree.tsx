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
import { Loader2 } from "lucide-react";

export default function FileTree({
  onSelect,
  selectedPath,
  onFileTreeChange,
}: {
  onSelect: (f: { path: string; language: string }) => void;
  selectedPath?: string | null;
  onFileTreeChange?: () => void;
}) {
  const { appId } = useSession();
  const { toast } = useToast();
  const {
    data: root,
    error,
    isLoading,
    mutate,
  } = useSWR<Node[]>(`/api/code/directory?path=/&appId=${appId}`, fetchJSON);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const [createName, setCreateName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateFile = async (parentPath: string, fileName: string) => {
    if (!fileName.trim()) return;
    setLoading(true);

    const fullPath =
      parentPath === "/" ? `/${fileName}` : `${parentPath}/${fileName}`;

    try {
      const response = await fetch("/api/code/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          path: fullPath,
          content: "",
        }),
      });

      if (response.ok) {
        // Refresh the file tree
        await mutate();
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    if (!folderName.trim()) return;
    setLoading(true);
    const fullPath =
      parentPath === "/" ? `/${folderName}` : `${parentPath}/${folderName}`;
    try {
      const response = await fetch("/api/code/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          path: fullPath,
        }),
      });
      if (response.ok) {
        await mutate();
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
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (filePath: string, isFolder = false) => {
    const fileName = filePath.split("/").pop() || "file";
    setLoading(true);
    try {
      let response;
      if (isFolder) {
        response = await fetch("/api/code/directory", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId,
            path: filePath,
          }),
        });
      } else {
        response = await fetch("/api/code/file", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId,
            path: filePath,
          }),
        });
      }

      if (response.ok) {
        await mutate();
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
    } finally {
      setLoading(false);
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
    <div className="h-full overflow-y-auto overscroll-contain relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="py-2">
        <div className="px-4 flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Project Files</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Create file or folder"
            disabled={loading}
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
                  disabled={loading}
                >
                  File
                </Button>
                <Button
                  type="button"
                  variant={createType === "folder" ? "default" : "outline"}
                  onClick={() => setCreateType("folder")}
                  className={createType === "folder" ? "" : "bg-background"}
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!createName.trim() || loading}>
                  Create {createType === "file" ? "File" : "Folder"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <ul className="pl-2 text-muted-foreground text-sm font-mono">
          {root?.map((n) =>
            n.type === "file" ? (
              <FileItem
                key={n.path}
                node={n}
                active={selectedPath === n.path}
                onSelect={onSelect}
                onDelete={loading ? () => {} : handleDeleteFile}
              />
            ) : (
              <FolderItem
                key={n.path}
                node={n}
                activePath={selectedPath}
                onSelect={onSelect}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onDelete={loading ? () => {} : handleDeleteFile}
                appId={appId}
                loading={loading}
              />
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
