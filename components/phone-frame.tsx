import { Loader2 } from "lucide-react";

interface PhoneFrameProps {
  scaleFactor: number;
  contentWidth: number;
  contentHeight: number;
  padding: number;
  children: React.ReactNode;
}

export function PhoneFrame({
  scaleFactor,
  contentWidth,
  contentHeight,
  padding,
  children,
}: PhoneFrameProps) {
  // Base dimensions for the phone frame
  const basePhoneWidth = 300;
  const basePhoneHeight = 580;

  // Scaled dimensions
  const phoneWidth = basePhoneWidth * scaleFactor;
  const phoneHeight = basePhoneHeight * scaleFactor;

  return (
    <div 
      className="relative"
      style={{
        width: `${phoneWidth}px`,
        height: `${phoneHeight}px`,
      }}
    >
      {/* Side buttons - scaled with the phone */}
      <div
        className="absolute rounded-l-md shadow-lg bg-black"
        style={{
          top: `${90 * scaleFactor}px`,
          left: "0",
          width: `${4 * scaleFactor}px`,
          height: `${30 * scaleFactor}px`,
        }}
      ></div>
      <div
        className="absolute rounded-l-md shadow-lg bg-black"
        style={{
          top: `${135 * scaleFactor}px`,
          left: "0",
          width: `${4 * scaleFactor}px`,
          height: `${30 * scaleFactor}px`,
        }}
      ></div>
      {/* Power Button - scaled with the phone */}
      <div
        className="absolute rounded-r-md shadow-lg bg-black"
        style={{
          top: `${90 * scaleFactor}px`,
          right: "0",
          width: `${4 * scaleFactor}px`,
          height: `${45 * scaleFactor}px`,
        }}
      ></div>

      {/* Content area - scaled with the phone */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          borderRadius: `${48 * scaleFactor}px`,
        }}
      >
        {children}
      </div>

      {/* Phone border overlay - scaled with the phone */}
      <div
        className="absolute pointer-events-none bg-transparent"
        style={{
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          borderRadius: `${48 * scaleFactor}px`,
          borderWidth: `${10 * scaleFactor}px`,
          borderStyle: "solid",
          borderColor: "black",
        }}
      />

      {/* iPhone Notch - scaled with the phone */}
      <div
        className="absolute bg-black pointer-events-none"
        style={{
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: `${120 * scaleFactor}px`,
          height: `${25 * scaleFactor}px`,
          borderBottomLeftRadius: `${14 * scaleFactor}px`,
          borderBottomRightRadius: `${14 * scaleFactor}px`,
        }}
      />
    </div>
  );
} 