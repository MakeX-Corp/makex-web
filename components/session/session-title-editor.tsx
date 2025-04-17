import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SessionTitleEditorProps {
  title: string;
  sessionId: string;
  authToken: string;
  onSave: (sessionId: string, newTitle: string) => void;
  isSelected: boolean;
}
export function SessionTitleEditor({
  title,
  sessionId,
  authToken,
  onSave,
  isSelected,
}: SessionTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || "New Chat");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // When editing starts, focus the input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (isLoading) return;

    // Don't update if title hasn't changed
    if (editedTitle === title) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/title`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId,
          title: editedTitle,
        }),
      });

      if (response.ok) {
        // Update the parent component with the new title
        onSave(sessionId, editedTitle);
      } else {
        // Revert to original title on error
        setEditedTitle(title || "New Chat");
        console.error("Failed to update session title");
      }
    } catch (error) {
      console.error("Error updating session title:", error);
      setEditedTitle(title || "New Chat");
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(title || "New Chat");
    setIsEditing(false);
  };

  // Prevent form submission on Enter key
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <div className="truncate flex-1">
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="h-7 text-sm py-1"
            disabled={isLoading}
          />
          <div
            onClick={handleSave}
            className="p-1 text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          >
            <Check className="h-4 w-4" />
          </div>
          <div
            onClick={handleCancel}
            className="p-1 text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCancel()}
          >
            <X className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <span
          className={`truncate ${isSelected ? "font-medium" : ""}`}
          onDoubleClick={handleDoubleClick}
        >
          {title || "New Chat"}
        </span>
      )}
    </div>
  );
}
