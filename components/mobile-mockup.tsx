import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { PhoneFrame } from "./phone-frame";

interface MobileMockupProps {
  appUrl: string | null;
  iframeKey: any;
  state: any;
}

export default function MobileMockup({
  appUrl,
  iframeKey,
  state,
}: MobileMockupProps) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    // Track window size
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Determine what to display based on state
  const getDisplayContent = () => {
    const sandboxStatus = state?.sandbox_status;
    const expoStatus = state?.expo_status;
    const appStatus = state?.app_status;

    // Highest precedence: Container state
    if (sandboxStatus === "paused") {
      return {
        message: "Refresh page to restart container",
        showSpinner: false,
      };
    }

    if (sandboxStatus === "pausing") {
      return {
        message: "Container is pausing...",
        showSpinner: false,
      };
    }

    // Container is active
    if (sandboxStatus === "active") {
      // If expo_status is not bundled, show expo_status
      if (expoStatus !== "bundled") {
        return {
          message: `Expo: ${expoStatus || "loading"}...`,
          showSpinner: true,
        };
      }

      // If expo_status is bundled, show app_status
      if (expoStatus === "bundled") {
        return {
          message: `App: ${appStatus || "loading"}...`,
          showSpinner: true,
        };
      }
    }

    // Default fallback
    return {
      message: "App is loading...",
      showSpinner: true,
    };
  };

  const displayContent = getDisplayContent();

  return (
    <div className="w-full h-full flex items-center justify-center">
      <PhoneFrame
        scaleFactor={scaleFactor}
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        padding={padding}
      >
        {/* Show the app if container is active, expo_status is bundled, and app_status is active */}
        {state?.sandbox_status === "active" &&
        state?.expo_status === "bundled" &&
        state?.app_status === "active" &&
        appUrl ? (
          <iframe
            key={[
              iframeKey,
              state?.sandbox_status,
              state?.app_status,
            ].toString()}
            src={appUrl}
            style={{
              width: `${contentWidth}px`,
              height: `${contentHeight}px`,
              marginTop: `${padding}px`,
              marginLeft: `${padding}px`,
              border: "none",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-black">
            <span style={{ fontSize: `${14 * scaleFactor}px` }}>
              {displayContent.message}
            </span>
            {displayContent.showSpinner && (
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
      </PhoneFrame>
    </div>
  );
}
