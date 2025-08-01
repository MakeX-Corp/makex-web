"use client";
import { useState } from "react";
import { Settings, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface EnvironmentVariablesProps {
  envVars: Array<{ key: string; value: string }>;
  onEnvVarsChange: (envVars: Array<{ key: string; value: string }>) => void;
}

export function EnvironmentVariables({
  envVars,
  onEnvVarsChange,
}: EnvironmentVariablesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showValues, setShowValues] = useState(false);

  const addEnvironmentVariable = () => {
    onEnvVarsChange([...envVars, { key: "", value: "" }]);
  };

  const updateEnvironmentVariable = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    onEnvVarsChange(newEnvVars);
  };

  const removeEnvironmentVariable = (index: number) => {
    const newEnvVars = envVars.filter((_, i) => i !== index);
    onEnvVarsChange(newEnvVars);
  };

  const setVariablesCount = envVars.filter(
    (env) => env.key && env.value,
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />

          {setVariablesCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              {setVariablesCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Environment Variables</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowValues(!showValues)}
            >
              {showValues ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {envVars.map((envVar, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Key</Label>
                    <Input
                      value={envVar.key}
                      onChange={(e) =>
                        updateEnvironmentVariable(index, "key", e.target.value)
                      }
                      placeholder="e.g., API_KEY"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Value
                    </Label>
                    <Input
                      value={envVar.value}
                      onChange={(e) =>
                        updateEnvironmentVariable(
                          index,
                          "value",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., your-api-key"
                      type={showValues ? "text" : "password"}
                      className="text-xs h-8"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEnvironmentVariable(index)}
                    className="mt-6 h-8 w-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addEnvironmentVariable}
            className="w-full mt-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
