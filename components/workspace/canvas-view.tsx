"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { useSession } from "@/context/session-context";
import { PhoneFrame } from "@/components/phone-frame";

export default function CanvasView() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(0.5);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const { appUrl } = useSession();

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

  useEffect(() => {
    // Track window size
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setCanvasScale((prev) => Math.min(Math.max(0.1, prev * delta), 3));
      }
    };

    const element = canvasRef.current;
    if (element) {
      element.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (element) {
        element.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const SCREENS = [
    {
      name: "index",
      title: "Water Tracker",
      icon: "local-drink",
      path: `${appUrl}/`
    },
    {
      name: "stats",
      title: "Statistics",
      icon: "bar-chart",
      path: `${appUrl}/stats`
    }
  ];

  return (
    <div
      ref={canvasRef}
      className="w-full h-full overflow-hidden bg-grid-pattern relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute inset-0 origin-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${canvasScale})`,
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[700px] grid grid-cols-2 gap-16">
            {SCREENS.map((screen) => (
              <div key={screen.name} className="relative">
                <PhoneFrame
                  scaleFactor={scaleFactor}
                  contentWidth={contentWidth}
                  contentHeight={contentHeight}
                  padding={padding}
                >
                  <iframe
                    src={screen.path}
                    style={{
                      width: `${contentWidth}px`,
                      height: `${contentHeight}px`,
                      marginTop: `${padding}px`,
                      marginLeft: `${padding}px`,
                      border: "none",
                    }}
                    title={screen.name}
                  />
                </PhoneFrame>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 