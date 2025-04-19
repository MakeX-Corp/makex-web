import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface MobileMockupProps {
  appId: string;
  appUrl: string;
  authToken: string;
  iframeKey: any;
}

export default function MobileMockup({ appId,appUrl,iframeKey,authToken }: MobileMockupProps) {

  const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);
  
  const handleCreateSandbox = async () => {
    if (!appId) return; 

    try {
      setIsCreatingSandbox(true);
      const response = await fetch("/api/sandbox/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          appId: appId,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const sandboxData = await response.json();
      console.log(sandboxData);

    } catch (error) {
      console.error("Error recreating sandbox:", error);
    } finally {
      setIsCreatingSandbox(false);
    }
  };

  useEffect(() => {
    handleCreateSandbox();
  }, []);


  
  return (
    <div className={`flex items-center justify-center`}>
      <div className="relative">
        <div className="absolute top-[90px] left-0 w-[4px] h-[30px] bg-black rounded-l-md shadow-lg"></div>
        <div className="absolute top-[135px] left-0 w-[4px] h-[30px] bg-black rounded-l-md shadow-lg"></div>

        {/* Power Button */}
        <div className="absolute top-[90px] right-0 w-[4px] h-[45px] bg-black rounded-r-md shadow-lg"></div>

        {/* Phone Container */}
        <div className="relative w-[300px] h-[600px] rounded-[48px] mx-[4px]">
          <div className="absolute inset-0 rounded-[48px] overflow-hidden">
            {isCreatingSandbox ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <iframe
                key={iframeKey}
                src={appUrl || ""}
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
