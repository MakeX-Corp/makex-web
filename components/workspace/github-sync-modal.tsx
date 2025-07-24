import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle, Trash2 } from "lucide-react";

interface GitHubSyncModalProps {
  open: boolean;
  onClose: () => void;
  appId: string;
  github_sync_repo: string | null;
  onRefresh?: () => void;
}

export function GitHubSyncModal({
  open,
  onClose,
  appId,
  github_sync_repo,
  onRefresh,
}: GitHubSyncModalProps) {
  const [repoName, setRepoName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentSyncRepo, setCurrentSyncRepo] = useState<string | null>(github_sync_repo);
  const [loading, setLoading] = useState(false);
  const [isChangingRepo, setIsChangingRepo] = useState(false);
  const { toast } = useToast();

  // Update currentSyncRepo when github_sync_repo prop changes
  useEffect(() => {
    setCurrentSyncRepo(github_sync_repo);
  }, [github_sync_repo]);

  // Fetch current GitHub sync status when modal opens (fallback)
  useEffect(() => {
    if (open && appId && !github_sync_repo) {
      fetchCurrentSyncStatus();
    }
  }, [open, appId, github_sync_repo]);

  const fetchCurrentSyncStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/app?id=${appId}`);

      if (!res.ok) {
        throw new Error("Failed to fetch app data");
      }

      const appData = await res.json();
      setCurrentSyncRepo(appData.github_sync_repo || null);
    } catch (err: any) {
      console.error("Error fetching sync status:", err);
      toast({
        title: "Error",
        description: "Failed to fetch current sync status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // If we're changing an existing repository or have an original sync repo, use PUT
      const method = currentSyncRepo || github_sync_repo ? "PUT" : "POST";

      const res = await fetch("/api/github-sync", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, repoName }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to sync with GitHub");
      }

      const result = await res.json();
      toast({
        title:
          currentSyncRepo || github_sync_repo ? "GitHub Sync Updated!" : "GitHub Sync Configured!",
        description: result.message || `Your app will now sync with ${repoName}.`,
      });

      // Update local state
      setCurrentSyncRepo(repoName);
      setRepoName("");

      // Refresh the session context to get updated data
      onRefresh?.();

      onClose();
    } catch (err: any) {
      toast({
        title: "GitHub Sync Failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch("/api/github-sync", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove GitHub sync");
      }

      const result = await res.json();
      toast({
        title: "GitHub Sync Removed!",
        description: result.message || "GitHub sync has been removed.",
      });

      // Update local state
      setCurrentSyncRepo(null);
      setRepoName("");

      // Refresh the session context to get updated data
      onRefresh?.();
    } catch (err: any) {
      toast({
        title: "Failed to Remove Sync",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = () => {
    if (currentSyncRepo) {
      setRepoName(currentSyncRepo);
      setCurrentSyncRepo(null);
      setIsChangingRepo(true);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>GitHub Sync Setup</DialogTitle>
            <DialogDescription>Loading current sync status...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>GitHub Sync Setup</DialogTitle>
          <DialogDescription>
            {currentSyncRepo
              ? "Manage your GitHub sync configuration"
              : isChangingRepo
                ? "Change your GitHub repository"
                : "Set up automatic syncing of your app code to GitHub"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {currentSyncRepo ? (
            // Show current sync status
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Currently syncing with:
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">{currentSyncRepo}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleUpdate} className="flex-1">
                  Change Repository
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Remove Sync
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Show setup form
            <div className="space-y-3">
              {!isChangingRepo && (
                <>
                  <div>
                    <h4 className="font-medium mb-2">1. Create a GitHub repository</h4>
                    <p className="text-sm text-muted-foreground">
                      Go to{" "}
                      <a
                        href="https://github.com/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        GitHub
                      </a>{" "}
                      and create a new repository for your app.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">2. Install MakeX Sync App</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Install the MakeX Sync GitHub App on your repository to enable automatic
                      syncing.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          "https://github.com/apps/makex-sync/installations/select_target",
                          "_blank"
                        )
                      }
                      className="w-full"
                    >
                      Install MakeX Sync App
                    </Button>
                  </div>
                </>
              )}

              <div>
                <h4 className="font-medium mb-2">
                  {isChangingRepo ? "Enter new repository name" : "3. Enter repository name"}
                </h4>
                <Input
                  placeholder="username/repo (e.g. johndoe/my-app)"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  autoFocus
                />
              </div>

              {isChangingRepo && (
                <DialogFooter>
                  <div className="flex w-full justify-between items-center">
                    <Button onClick={handleSave} disabled={!repoName || saving}>
                      {saving ? "Saving..." : "Update Repository"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsChangingRepo(false);
                        setRepoName("");
                        setCurrentSyncRepo(github_sync_repo);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </DialogFooter>
              )}
            </div>
          )}
        </div>

        {!currentSyncRepo && !isChangingRepo && (
          <DialogFooter>
            <div className="flex w-full justify-between items-center">
              <Button onClick={handleSave} disabled={!repoName || saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsChangingRepo(false);
                    setRepoName("");
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
