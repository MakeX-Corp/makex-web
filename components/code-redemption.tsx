import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Gift, CheckCircle, XCircle } from "lucide-react";

// Valid codes
const VALID_CODES = [
  "UNLIMITED2024",
  "FREEMESSAGES",
  "BETAUSER",
  "MAKEX2024",
  "UNLIMITED",
];

interface CodeRedemptionProps {
  onUnlimitedChange?: (isUnlimited: boolean) => void;
}

export default function CodeRedemption({
  onUnlimitedChange,
}: CodeRedemptionProps) {
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [code, setCode] = useState("");
  const [codeMessage, setCodeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);

  // Check if unlimited messages are already activated
  useEffect(() => {
    const unlimited = localStorage.getItem("unlimited_messages_activated");
    if (unlimited === "true") {
      setIsUnlimited(true);
      onUnlimitedChange?.(true);
    }
  }, [onUnlimitedChange]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const upperCode = code.trim().toUpperCase();
    const isValidCode = VALID_CODES.includes(upperCode);

    if (isValidCode) {
      localStorage.setItem("unlimited_messages_activated", "true");
      setIsUnlimited(true);
      onUnlimitedChange?.(true);
      setCode("");
      setCodeMessage({
        type: "success",
        text: "Code redeemed successfully! You now have unlimited messages.",
      });
      setTimeout(() => {
        setShowCodeDialog(false);
        setCodeMessage(null);
      }, 2000);
    } else {
      setCodeMessage({
        type: "error",
        text: "Invalid code. Please try again.",
      });
    }
  };

  const handleResetUnlimited = () => {
    localStorage.removeItem("unlimited_messages_activated");
    setIsUnlimited(false);
    onUnlimitedChange?.(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowCodeDialog(open);
    if (!open) {
      setCode("");
      setCodeMessage(null);
    }
  };

  return (
    <>
      <div className="flex justify-center mt-4">
        {isUnlimited ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
              ✓ Unlimited Messages
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetUnlimited}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCodeDialog(true)}
            className="flex items-center gap-2"
          >
            <Gift className="w-4 h-4" />
            Redeem Code
          </Button>
        )}
      </div>

      {/* Code Redemption Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Redeem Code
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">
                Are you part of the MakeX Hackathon?
              </p>
              <p className="text-sm text-muted-foreground">
                Redeem your code here to unlock unlimited messages and build
                without limits!
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your hackathon code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-lg font-mono"
              />

              {codeMessage && (
                <div
                  className={`flex items-center space-x-2 rounded-md p-3 text-sm ${
                    codeMessage.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {codeMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>{codeMessage.text}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={!code.trim()}>
                Redeem Code
              </Button>
            </form>

            <div className="text-xs text-muted-foreground text-center">
              Don't have a code? Contact the hackathon organizers for your
              redemption code.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
