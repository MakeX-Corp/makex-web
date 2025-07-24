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
  onDelete,
  apiUrl,
}: {
  node: Extract<Node, { type: "folder" }>;
  activePath?: string | null;
  onSelect: (f: { path: string; language: string }) => void;
  onCreateFile: (parentPath: string, fileName: string) => void;
  onDelete: (path: string) => void;
  apiUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const {
    data: children = [],
    isLoading,
    mutate,
  } = useSWR<Node[]>(
    open
      ? `/api/files?path=${encodeURIComponent(node.path)}&api_url=${apiUrl}`
      : null,
    fetchJSON,
    { refreshInterval: 5000 }
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuOpen(true);
  };

  const handleCreateFile = () => {
    setContextMenuOpen(false);
    setCreateFileDialogOpen(true);
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
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu
            open={contextMenuOpen}
            onOpenChange={setContextMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <div className="w-0 h-0 overflow-hidden">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreateFile}>
                <Plus className="mr-2 h-4 w-4" />
                Create File
              </DropdownMenuItem>
              <DeleteConfirmationDialog
                fileName={node.name}
                onConfirm={() => onDelete(node.path)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Context Menu Create File Dialog */}
      <Dialog
        open={createFileDialogOpen}
        onOpenChange={setCreateFileDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const fileName = formData.get("fileName") as string;
              if (fileName.trim()) {
                onCreateFile(node.path, fileName.trim());
                setCreateFileDialogOpen(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="fileName" className="text-sm font-medium">
                File Name
              </label>
              <Input
                id="fileName"
                name="fileName"
                placeholder="Enter file name (e.g., index.tsx)"
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateFileDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create File</Button>
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
                  onDelete={onDelete}
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
