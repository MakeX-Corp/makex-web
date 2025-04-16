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
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="absolute top-[90px] left-0 w-[4px] h-[30px] bg-black rounded-l-md shadow-lg"></div>
        <div className="absolute top-[135px] left-0 w-[4px] h-[30px] bg-black rounded-l-md shadow-lg"></div>

        {/* Power Button */}
        <div className="absolute top-[90px] right-0 w-[4px] h-[45px] bg-black rounded-r-md shadow-lg"></div>

        {/* Phone Container */}
        <div className="relative w-[300px] h-[600px] rounded-[48px] mx-[4px]">
          <div className="absolute inset-0 rounded-[48px] overflow-hidden">
            {children}
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
