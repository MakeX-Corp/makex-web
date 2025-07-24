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
  return (
    <li>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center group">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
