import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function CreateFileDialog({
  parentPath,
  onCreateFile,
}: {
  parentPath: string;
  onCreateFile: (parentPath: string, fileName: string) => void;
}) {
  const [fileName, setFileName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileName.trim()) {
      onCreateFile(parentPath, fileName.trim());
      setFileName("");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fileName" className="text-sm font-medium">
              File Name
            </label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
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
                setIsOpen(false);
                setFileName("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!fileName.trim()}>
              Create File
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
