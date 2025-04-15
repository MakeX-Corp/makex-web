import { ReactNode } from "react";

interface MobileMockupProps {
  children: ReactNode;
  className?: string;
}

export default function MobileMockup({
  children,
  className = "",
}: MobileMockupProps) {
  return (
    <div className="flex-grow overflow-hidden object-cover flex items-center justify-center">
      <div className="relative w-[292.6px] h-[595.65px] rounded-[48px] bg-black p-[12px] shadow-2xl border-[10px] border-gray-800 flex items-center justify-center overflow-hidden">
        {/* iPhone Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-[14px]"></div>

        {children}
      </div>
    </div>
  );
}
