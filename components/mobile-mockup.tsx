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
  containerState
}: MobileMockupProps) {

  return (

    <div className={`flex items-center justify-center`}>
      <div className="relative">
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
                style={{
                  height: "100%",
                }}
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
