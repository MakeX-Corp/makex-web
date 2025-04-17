import { useState } from "react";

import { ChevronDown, ChevronRight, Check, X, Loader2, Eye } from "lucide-react";
import { toolStates, ToolName } from "@/utils/client/tools-dictionary";
import CodeRenderer from "./code-renderer";

export default function ToolInvocation({ part }: { part: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCodePopup, setShowCodePopup] = useState(false);
    const isSuccess = part.toolInvocation.state === "result" && !part.toolInvocation.result?.error;
    const hasError = part.toolInvocation.state === "result" && part.toolInvocation.result?.error;
    const hasResultData = part.toolInvocation.state === "result" && part.toolInvocation.result?.data;
    const isInProgress = part.toolInvocation.state === "partial-call" || part.toolInvocation.state === "call";
    const toolName = part.toolInvocation.toolName as ToolName;
    const toolState = hasError ? "error" : part.toolInvocation.state as "call" | "result";
    const toolMessage = toolStates[toolName]?.[toolState] || toolName;
    const isFileRelated = toolName !== 'runSql';
    const filePath = isFileRelated ? part.toolInvocation.args?.path : null;
  
    return (
      <div className="bg-muted/50 rounded-md p-3 my-2 border border-border">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!isSuccess || !hasResultData}
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
            {filePath && <span className="text-muted-foreground text-xs">({filePath})</span>}
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
                  toolName === 'readFile' || toolName === 'writeFile' ? (
                    <div className="relative">
                      <code className="text-foreground whitespace-pre-wrap break-all overflow-wrap break-word">
                        {toolName === 'readFile' 
                          ? typeof part.toolInvocation.result.data === 'string' 
                            ? part.toolInvocation.result.data 
                            : JSON.stringify(part.toolInvocation.result.data, null, 2)
                          : typeof part.toolInvocation.args.content === 'string'
                            ? part.toolInvocation.args.content
                            : JSON.stringify(part.toolInvocation.args.content, null, 2)
                        }
                      </code>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCodePopup(true);
                        }}
                        className="absolute top-0 right-0 p-1 bg-background/90 border border-border shadow-sm rounded hover:bg-muted transition-colors"
                        title="View in popup"
                      >
                        <Eye className="h-4 w-4 text-foreground" />
                      </button>
                      
                      {showCodePopup && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCodePopup(false)}>
                          <div className="bg-card p-4 rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-medium">{filePath || 'Code View'}</h3>
                              <button onClick={() => setShowCodePopup(false)}>
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <CodeRenderer 
                              content={
                                toolName === 'readFile' ? part.toolInvocation.result.data : 
                                part.toolInvocation.args.content
                              }
                              language="javascript"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <code className="text-foreground whitespace-pre-wrap break-all overflow-wrap break-word">
                      {JSON.stringify(part.toolInvocation.result.data, null, 2)}
                    </code>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };