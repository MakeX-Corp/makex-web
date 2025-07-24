import {
  TooltipContent,
  TooltipTrigger,
  Tooltip,
} from "@/components/ui/tooltip";
import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import DeleteConfirmationDialog from "./delete-file-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { getFileIcon, formatFileSize, Node } from "./utils";
import { useState } from "react";

export default function FileItem({
  node,
  active,
  onSelect,
  onDelete,
}: {
  node: Extract<Node, { type: "file" }>;
  active?: boolean;
  onSelect: (f: { path: string; language: string }) => void;
  onDelete: (path: string) => void;
}) {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Add a small delay to prevent immediate opening when context menu appears at cursor
    setTimeout(() => setContextMenuOpen(true), 50);
  };

  return (
    <li>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center group"
              onContextMenu={handleContextMenu}
            >
              <button
                onClick={() =>
                  onSelect({ path: node.path, language: node.language })
                }
                className={cn(
                  "flex flex-1 items-center gap-2 px-2 py-1 rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground font-medium"
                )}
              >
                {getFileIcon(node.name)}
                <span className="truncate">{node.name}</span>
              </button>
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
                <DropdownMenuContent side="right">
                  <DeleteConfirmationDialog
                    fileName={node.name}
                    onConfirm={() => onDelete(node.path)}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
