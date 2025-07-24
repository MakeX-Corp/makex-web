import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Folder, MoreHorizontal } from "lucide-react";
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
          <CreateFileDialog
            parentPath={node.path}
            onCreateFile={onCreateFile}
          />
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
              <DeleteConfirmationDialog
                fileName={node.name}
                onConfirm={() => onDelete(node.path)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
