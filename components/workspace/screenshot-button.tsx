import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScreenshotButtonProps {
  onCapture: () => void;
  isCapturing: boolean;
}

export function ScreenshotButton({
  onCapture,
  isCapturing,
}: ScreenshotButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCapture}
            disabled={isCapturing}
            className="h-6 px-2 flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Take a screenshot of your app</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
