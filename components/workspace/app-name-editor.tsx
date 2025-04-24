import { useState, useRef, FC, useEffect } from "react";
import { Edit, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAppName } from "@/lib/app-service";
import { useApp } from "@/context/AppContext";

interface AppNameEditorProps {
  appName: string;
  appId: string;
  authToken: string;
}

export const AppNameEditor: FC<AppNameEditorProps> = ({
  appName,
  appId,
  authToken,
}) => {
  const { refreshApps } = useApp();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [localAppName, setLocalAppName] = useState<string>(appName);
  const [tempAppName, setTempAppName] = useState<string>(appName);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setLocalAppName(appName);
  }, [appName]);

  const handleStartEditing = (): void => {
    setIsEditing(true);
    setTempAppName(localAppName);
  };

  const handleSaveAppName = async (): Promise<void> => {
    if (!tempAppName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      // Call the provided API function
      const success = await updateAppName(appId, tempAppName.trim(), authToken);

      if (success) {
        // Update local state only on success
        setLocalAppName(tempAppName.trim());
        refreshApps();
      } else {
        console.error("Failed to update app name");
        // No need to revert tempAppName as we'll discard it
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update app name:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEditing = (): void => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          value={tempAppName}
          onChange={(e) => setTempAppName(e.target.value)}
          className="h-8 w-40 sm:w-48"
          placeholder="App name"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveAppName();
            if (e.key === "Escape") handleCancelEditing();
          }}
          disabled={isSubmitting}
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveAppName}
            disabled={isSubmitting || !tempAppName.trim()}
            className="px-2 h-8 flex-shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check size={16} />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEditing}
            className="p-0 h-8 w-8 flex-shrink-0"
            disabled={isSubmitting}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 group">
      <h1 className="text-xl font-semibold text-foreground">{localAppName}</h1>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleStartEditing}
      >
        <Edit
          size={14}
          className="text-muted-foreground hover:text-foreground"
        />
      </Button>
    </div>
  );
};
