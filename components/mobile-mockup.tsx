import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface MobileMockupProps {
  appUrl: string | null;
  iframeKey: any;
  containerState: "starting" | "live";
}

export default function MobileMockup({
  appUrl,
  iframeKey,
  containerState,
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

  // Determine scale based on window width
  const getScale = () => {
    if (windowWidth > 1200) return 1;
    if (windowWidth > 992) return 0.9;
    if (windowWidth > 768) return 0.8;
    if (windowWidth > 576) return 0.7;
    if (windowWidth > 400) return 0.6;
    return 0.5;
  };

  const scale = getScale();

  // Container styles with flex centering
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    padding: "10px",
  };

  // Mockup phone styles with scaling
  const phoneStyle = {
    position: "relative" as const,
    transform: `scale(${scale})`,
    transformOrigin: "center center",
    transition: "transform 0.2s ease",
  };

  return (
    <div style={containerStyle}>
      <div style={phoneStyle}>
        {/* Side buttons */}
        <div className="absolute top-[90px] left-0 w-[4px] h-[30px] bg-black rounded-l-md shadow-lg"></div>
        <div className="absolute top-[135px] left-0 w-[4px] h-[30px] bg-black rounded-l-md shadow-lg"></div>
        {/* Power Button */}
        <div className="absolute top-[90px] right-0 w-[4px] h-[45px] bg-black rounded-r-md shadow-lg"></div>

        {/* Phone Container */}
        <div className="relative w-[300px] h-[580px] rounded-[48px] mx-[4px]">
          <div className="absolute inset-0 rounded-[48px] overflow-hidden">
            {containerState === "starting" ? (
              <div className="flex flex-col items-center justify-center h-full">
                <span>The Server is starting</span>
                <Loader2 className="h-4 w-4 animate-spin mt-2" />
              </div>
            ) : (
              <iframe
                key={iframeKey}
                src={appUrl || undefined}
                className="w-full h-full"
              />
            )}
          </div>

          {/* Phone border overlay */}
          <div className="absolute inset-0 rounded-[48px] border-[10px] border-black pointer-events-none" />

          {/* iPhone Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-[14px] pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
