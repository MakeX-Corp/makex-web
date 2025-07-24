import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Folder, MoreHorizontal, Plus } from "lucide-react";
import DeleteConfirmationDialog from "./delete-file-dialog";
import { FolderOpen } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import useSWR from "swr";
import CreateFileDialog from "./create-file-dialog";
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
  apiUrl,
  loading = false,
}: {
  node: Extract<Node, { type: "folder" }>;
  activePath?: string | null;
  onSelect: (f: { path: string; language: string }) => void;
  onCreateFile: (parentPath: string, fileName: string) => void;
  onCreateFolder: (parentPath: string, folderName: string) => void;
  onDelete: (path: string) => void;
  apiUrl: string;
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
        )}&api_url=${apiUrl}`
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
              <div className="w-0 h-0 overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={loading}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right">
              <DropdownMenuItem
                onClick={loading ? () => {} : handleCreate}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create
              </DropdownMenuItem>
              <DeleteConfirmationDialog
                fileName={node.name}
                onConfirm={loading ? () => {} : () => onDelete(node.path)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Unified Create Dialog */}
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
                  onDelete={onDelete}
                />
              ) : (
                <FolderItem
                  key={n.path}
                  node={n}
                  activePath={activePath}
                  onSelect={onSelect}
                  onCreateFile={onCreateFile}
                  onCreateFolder={onCreateFolder}
                  onDelete={onDelete}
                  apiUrl={apiUrl}
                />
              ),
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
