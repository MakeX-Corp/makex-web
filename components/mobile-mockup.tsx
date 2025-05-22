import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneFrame } from "./phone-frame";

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
              App is starting
            </span>
            <Loader2
              className="animate-spin mt-2"
              style={{
                height: `${16 * scaleFactor}px`,
                width: `${16 * scaleFactor}px`,
              }}
            />
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}
