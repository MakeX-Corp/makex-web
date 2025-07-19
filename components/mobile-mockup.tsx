import { Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneFrame } from "./phone-frame";
import { Button } from "@/components/ui/button";

interface MobileMockupProps {
  appUrl: string | null;
  iframeKey: any;
  containerState: "starting" | "active" | "paused" | "resuming" | "pausing";
  appState: any;
}

export default function MobileMockup({
  appUrl,
  iframeKey,
  containerState,
  appState,
}: MobileMockupProps) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [stuckStartTime, setStuckStartTime] = useState<number | null>(null);
  const [showResetButton, setShowResetButton] = useState(false);

  useEffect(() => {
    // Track window size
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track when app gets stuck in intermediate states
  useEffect(() => {
    const stuckStates = ["starting", "loading", "rendering", "bundling", "changing"];
    const isStuck = containerState === "active" && stuckStates.includes(appState);

    if (isStuck) {
      if (!stuckStartTime) {
        setStuckStartTime(Date.now());
      }
    } else {
      setStuckStartTime(null);
      setShowResetButton(false);
    }
  }, [containerState, appState, stuckStartTime]);

  // Show reset button after 2 minutes of being stuck
  useEffect(() => {
    if (stuckStartTime) {
      const timer = setTimeout(() => {
        setShowResetButton(true);
      }, 2 * 60 * 1000); // 2 minutes

      return () => clearTimeout(timer);
    }
  }, [stuckStartTime]);

  const resetStuckApp = async () => {
    try {
      const response = await fetch("/api/reset-stuck-apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      
      if (response.ok && result.resetCount > 0) {
        // Reset the stuck tracking
        setStuckStartTime(null);
        setShowResetButton(false);
        
        // Reload the page to refresh the app state
        window.location.reload();
      }
    } catch (error) {
      console.error("Error resetting stuck app:", error);
    }
  };

  // Base dimensions for the phone frame
  const basePadding = 10;
  const basePhoneWidth = 300;
  const basePhoneHeight = 580;

  // Calculate scale factor based on window width
  const getScaleFactor = () => {
    if (windowWidth > 1200) return 1; // Full size on large screens
    if (windowWidth > 992) return 0.9; // 90% on medium-large screens
    if (windowWidth > 768) return 0.8; // 80% on medium screens
    if (windowWidth > 576) return 0.7; // 70% on small-medium screens
    if (windowWidth > 400) return 0.6; // 60% on small screens
    return 0.5; // 50% on very small screens
  };

  const scaleFactor = getScaleFactor();

  // Scaled dimensions
  const phoneWidth = basePhoneWidth * scaleFactor;
  const phoneHeight = basePhoneHeight * scaleFactor;
  const padding = basePadding * scaleFactor;

  // Content dimensions (phone size minus border thickness)
  const contentWidth = phoneWidth - padding * 2;
  const contentHeight = phoneHeight - padding * 2;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <PhoneFrame
        scaleFactor={scaleFactor}
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        padding={padding}
      >
        <iframe
          key={[iframeKey, containerState, appState].toString()}
          src={appUrl || undefined}
          style={{
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
            marginTop: `${padding}px`,
            marginLeft: `${padding}px`,
            border: "none",
          }}
        />

        {containerState !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-black">
            <span style={{ fontSize: `${14 * scaleFactor}px` }}>
              The Server is {containerState}
            </span>
            {containerState === "paused" || containerState === "pausing" ? (
              <span style={{ fontSize: `${14 * scaleFactor}px` }}>
                Due to inactivity
              </span>
            ) : (
              <Loader2
                className="animate-spin mt-2"
                style={{
                  height: `${16 * scaleFactor}px`,
                  width: `${16 * scaleFactor}px`,
                }}
              />
            )}
          </div>
        )}

        {containerState === "active" && appState !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-black">
            <span style={{ fontSize: `${14 * scaleFactor}px` }}>
              App is {appState}
            </span>
            <Loader2
              className="animate-spin mt-2"
              style={{
                height: `${16 * scaleFactor}px`,
                width: `${16 * scaleFactor}px`,
              }}
            />
            {showResetButton && (
              <div className="mt-4 flex flex-col items-center">
                <span style={{ fontSize: `${12 * scaleFactor}px` }} className="text-gray-600 mb-2">
                  App seems stuck?
                </span>
                <Button
                  onClick={resetStuckApp}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  style={{ 
                    fontSize: `${12 * scaleFactor}px`,
                    padding: `${4 * scaleFactor}px ${8 * scaleFactor}px`
                  }}
                >
                  <AlertCircle style={{ height: `${12 * scaleFactor}px`, width: `${12 * scaleFactor}px` }} />
                  Reset
                </Button>
              </div>
            )}
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}
