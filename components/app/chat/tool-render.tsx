import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import { toolStates, ToolName } from "@/utils/client/tools-dictionary";
import CodeRenderer from "@/components/app/chat/code-renderer";

export default function ToolInvocation({ part }: { part: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCodePopup, setShowCodePopup] = useState(false);

  const toolName = part.type.replace("tool-", "") as ToolName;
  const isSuccess = part.state === "output-available" && part.output?.success;
  const hasError = part.state === "output-available" && !part.output?.success;
  const hasResultData = part.state === "output-available" && part.output?.data;
  const isInProgress =
    part.state === "partial-call" ||
    part.state === "call" ||
    part.state === "pending";
  const toolState = hasError ? "error" : (part.state as "call" | "result");
  const toolMessage = toolStates[toolName]?.[toolState] || toolName;
  const isFileRelated = toolName !== "runSql";
  const filePath = isFileRelated ? part.input?.path : null;

  return (
    <div className="bg-muted/50 rounded-md p-3 my-2 border border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isInProgress || (!isSuccess && !hasResultData)}
        className={`w-full flex items-center justify-between text-sm font-medium text-foreground rounded-md transition-colors ${
          isInProgress || (!isSuccess && !hasResultData)
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        <div className="flex items-center gap-2">
          {hasResultData &&
            !isInProgress &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
          <span className="font-medium">{toolMessage}</span>
          {filePath && (
            <span className="text-muted-foreground text-xs">({filePath})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isInProgress ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : part.state === "output-available" ? (
            isSuccess ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 text-sm space-y-2">
          {(part.state === "partial-call" || part.state === "call") && (
            <div className="bg-muted rounded-md p-2 overflow-x-auto max-w-full">
              <code
                className="text-foreground whitespace-pre-wrap break-all"
                style={{ wordBreak: "break-word" }}
              >
                {JSON.stringify(part.input, null, 2)}
              </code>
            </div>
          )}
          {part.state === "output-available" && (
            <div className="bg-muted rounded-md p-2 overflow-x-auto max-w-full">
              {hasError ? (
                <code className="text-red-500 whitespace-pre-wrap break-all">
                  {part.output?.errorText || "Tool execution failed"}
                </code>
              ) : toolName === "readFile" ||
                toolName === "writeFile" ||
                toolName === "editFile" ? (
                <div className="relative">
                  <code className="text-foreground whitespace-pre-wrap break-all overflow-wrap break-word">
                    {toolName === "readFile"
                      ? typeof part.output.data === "string"
                        ? part.output.data
                        : JSON.stringify(part.output.data, null, 2)
                      : toolName === "editFile"
                      ? typeof part.output.data === "string"
                        ? part.output.data
                        : JSON.stringify(part.output.data, null, 2)
                      : typeof part.input.content === "string"
                      ? part.input.content
                      : JSON.stringify(part.input.content, null, 2)}
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
                    <div
                      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
                      onClick={() => setShowCodePopup(false)}
                    >
                      <div
                        className="bg-card p-4 rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">
                            {filePath || "Code View"}
                          </h3>
                          <button onClick={() => setShowCodePopup(false)}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <CodeRenderer
                          content={
                            toolName === "readFile"
                              ? part.output.data
                              : toolName === "editFile"
                              ? part.output.data
                              : part.input.content
                          }
                          language="javascript"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <code className="text-foreground whitespace-pre-wrap break-all overflow-wrap break-word">
                  {JSON.stringify(part.output.data, null, 2)}
                </code>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
