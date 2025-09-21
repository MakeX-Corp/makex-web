"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";

interface PausedAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PausedAppModal({ open, onOpenChange }: PausedAppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <RefreshCw className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <DialogTitle className="text-lg">App Paused</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Your app has been paused and cannot send messages at this time. You
            can reload the app using the reload button on the top right next to
            the mobile phone icon.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <Button onClick={() => onOpenChange(false)} className="px-6">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
