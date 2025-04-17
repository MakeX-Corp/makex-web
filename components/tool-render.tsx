import { useState } from "react";

import { ChevronDown, ChevronRight, Check, X, Loader2 } from "lucide-react";
import { toolStates, ToolName } from "@/utils/client/tools-dictionary";


export default function ToolInvocation({ part }: { part: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isSuccess = part.toolInvocation.state === "result" && !part.toolInvocation.result?.error;
    const hasError = part.toolInvocation.state === "result" && part.toolInvocation.result?.error;
    const hasResultData = part.toolInvocation.state === "result" && part.toolInvocation.result?.data;
    const isInProgress = part.toolInvocation.state === "partial-call" || part.toolInvocation.state === "call";
    const toolName = part.toolInvocation.toolName as ToolName;
    const toolState = hasError ? "error" : part.toolInvocation.state as "call" | "result";
    const toolMessage = toolStates[toolName]?.[toolState] || toolName;
  
    return (
      <div className="bg-muted/50 rounded-md p-3 my-2 border border-border">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!isSuccess}
          className={`w-full flex items-center justify-between text-sm font-medium text-foreground rounded-md transition-colors ${
            !isSuccess ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            {hasResultData && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            )}
            <span className="font-medium">{toolMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {isInProgress ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : isSuccess ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>
        </button>
        
        {isExpanded && (
          <div className="mt-2 text-sm space-y-2">
            {(part.toolInvocation.state === "partial-call" || part.toolInvocation.state === "call") && (
              <div className="bg-muted rounded-md p-2 overflow-x-auto max-w-full">
                <code
                  className="text-foreground whitespace-pre-wrap break-all"
                  style={{ wordBreak: "break-word" }}
                >
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </code>
              </div>
            )}
            {part.toolInvocation.state === "result" && (
              <div className="bg-muted rounded-md p-2 overflow-x-auto max-w-full">
                {hasError ? (
                  <code className="text-red-500 whitespace-pre-wrap break-all">
                    {part.toolInvocation.result.error}
                  </code>
                ) : (
                  <code
                    className="text-foreground whitespace-pre-wrap break-all"
                    style={{ wordBreak: "break-word" }}
                  >
                    {JSON.stringify(part.toolInvocation.result.data, null, 2)}
                  </code>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };