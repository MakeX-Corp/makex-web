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
import { Folder, FileText, Plus } from "lucide-react";

export default function CreateFileDialog({
  parentPath,
  onCreateFile,
}: {
  parentPath: string;
  onCreateFile: (
    parentPath: string,
    fileName: string,
    isFolder: boolean
  ) => void;
}) {
  const [fileName, setFileName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFolder, setIsFolder] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileName.trim()) {
      const finalName = isFolder ? fileName.trim() : fileName.trim();
      onCreateFile(parentPath, finalName, isFolder);
      setFileName("");
      setIsFolder(false);
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
          <DialogTitle>Create New {isFolder ? "Folder" : "File"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fileName" className="text-sm font-medium">
              {isFolder ? "Folder" : "File"} Name
            </label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={
                isFolder
                  ? "Enter folder name"
                  : "Enter file name (e.g., index.tsx)"
              }
              className="mt-1"
              autoFocus
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={isFolder ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFolder(true)}
            >
              <Folder className="h-4 w-4 mr-2" />
              Folder
            </Button>
            <Button
              type="button"
              variant={!isFolder ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFolder(false)}
            >
              <FileText className="h-4 w-4 mr-2" />
              File
            </Button>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setFileName("");
                setIsFolder(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!fileName.trim()}>
              Create {isFolder ? "Folder" : "File"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
