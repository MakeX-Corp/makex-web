import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/app/preview/phone-frame";

interface MobileMockupProps {
  appUrl: string | null;
  iframeKey: any;
  state: any;
}

export function MobileMockup({
  appUrl,
  iframeKey,
  state,
}: MobileMockupProps) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const basePadding = 10;
  const basePhoneWidth = 300;
  const basePhoneHeight = 580;

  const getScaleFactor = () => {
    if (windowWidth > 1200) return 1;
    if (windowWidth > 992) return 0.9;
    if (windowWidth > 768) return 0.8;
    if (windowWidth > 576) return 0.7;
    if (windowWidth > 400) return 0.6;
    return 0.5;
  };

  const scaleFactor = getScaleFactor();

  const phoneWidth = basePhoneWidth * scaleFactor;
  const phoneHeight = basePhoneHeight * scaleFactor;
  const padding = basePadding * scaleFactor;

  const contentWidth = phoneWidth - padding * 2;
  const contentHeight = phoneHeight - padding * 2;

  const getDisplayContent = () => {
    const sandboxStatus = state?.sandbox_status;
    const expoStatus = state?.expo_status;
    const codingStatus = state?.coding_status;

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

    if (sandboxStatus === "active") {
      if (expoStatus !== "bundled") {
        return {
          message: `Expo: ${expoStatus || "loading"}...`,
          showSpinner: true,
        };
      }

      if (expoStatus === "bundled") {
        return {
          message: `App: ${codingStatus || "loading"}...`,
          showSpinner: true,
        };
      }
    }

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
        {state?.sandbox_status === "active" &&
        state?.expo_status === "bundled" &&
        state?.coding_status === "finished" &&
        appUrl ? (
          <iframe
            key={[
              iframeKey,
              state?.sandbox_status,
              state?.coding_status,
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
