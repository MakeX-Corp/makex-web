import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";

export const Preview = () => {
  return (
    <div className="w-1/2 flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-medium">Preview</h2>
        <Button variant="ghost" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex-1 bg-gray-50 flex items-center justify-center text-gray-400">
        App preview will appear here
      </div>
    </div>
  );
};
