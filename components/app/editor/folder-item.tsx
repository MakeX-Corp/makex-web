import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Folder, MoreHorizontal, Plus } from "lucide-react";
import { FolderOpen } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Node, fetchJSON } from "./utils";
import FileItem from "./file-item";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function FolderItem({
  node,
  activePath,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onDelete,
  appId,
  loading = false,
}: {
  node: Extract<Node, { type: "folder" }>;
  activePath?: string | null;
  onSelect: (f: { path: string; language: string }) => void;
  onCreateFile: (parentPath: string, fileName: string) => void;
  onCreateFolder: (parentPath: string, folderName: string) => void;
  onDelete: (path: string) => void;
  appId: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const [createName, setCreateName] = useState("");
  const {
    data: children = [],
    isLoading,
    mutate,
  } = useSWR<Node[]>(
    open
      ? `/api/code/directory?path=${encodeURIComponent(
          node.path,
        )}&appId=${appId}`
      : null,
    fetchJSON,
    { refreshInterval: 5000 },
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Add a small delay to prevent immediate opening when context menu appears at cursor
    setTimeout(() => setContextMenuOpen(true), 50);
  };

  const handleCreate = () => {
    setContextMenuOpen(false);
    setCreateDialogOpen(true);
  };

  return (
    <li className="py-0.5">
      <div
        className="flex items-center group"
        onContextMenu={handleContextMenu}
      >
        <div
          className={cn(
            "flex flex-1 items-center gap-2 cursor-pointer px-2 py-1 rounded-md",
            "hover:bg-accent hover:text-accent-foreground",
            "transition-colors",
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
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu
            open={contextMenuOpen}
            onOpenChange={setContextMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e);
                }}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setContextMenuOpen(false);
                  onDelete(node.path);
                }}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {open && (
        <ul className="pl-4 mt-1">
          {isLoading ? (
            <li className="py-1">
              <div className="flex items-center gap-2 px-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            </li>
          ) : (
            children.map((child) =>
              child.type === "file" ? (
                <FileItem
                  key={child.path}
                  node={child}
                  active={activePath === child.path}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ) : (
                <FolderItem
                  key={child.path}
                  node={child}
                  activePath={activePath}
                  onSelect={onSelect}
                  onCreateFile={onCreateFile}
                  onCreateFolder={onCreateFolder}
                  onDelete={onDelete}
                  appId={appId}
                  loading={loading}
                />
              ),
            )
          )}
        </ul>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New in {node.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!createName.trim()) return;
              if (createType === "file") {
                onCreateFile(node.path, createName.trim());
              } else {
                onCreateFolder(node.path, createName.trim());
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
    </li>
  );
}
