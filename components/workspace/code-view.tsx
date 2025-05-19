"use client";

import { useState } from "react";
import FileTree from "@/components/workspace/file-tree";
import CodeEditor from "@/components/workspace/code-editor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, FolderTree } from "lucide-react";

export default function CodeView() {
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    language: string;
  } | null>(null);

  return (
    <Card className="h-full w-full border overflow-hidden">
      <Tabs defaultValue="explorer" className="h-full flex flex-col">
        <div className="border-b">
          <TabsList className="h-10 w-full justify-start rounded-none border-b bg-muted/50">
            <TabsTrigger
              value="explorer"
              className="data-[state=active]:bg-background rounded-none border-r px-4"
            >
              <FolderTree className="h-4 w-4 mr-2" />
              Explorer
            </TabsTrigger>
            {/*<TabsTrigger
              value="editor"
              className="data-[state=active]:bg-background rounded-none px-4"
            >
              <Code className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>*/}
          </TabsList>
        </div>

        <TabsContent value="explorer" className="flex-1 p-0 mt-0">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full rounded-none"
          >
            {/* File tree sidebar */}
            <ResizablePanel
              defaultSize={22}
              minSize={15}
              className="border-r border-border bg-muted/40"
            >
              <div className="h-full flex flex-col">
                <FileTree
                  onSelect={setSelectedFile}
                  selectedPath={selectedFile?.path ?? null}
                />
              </div>
            </ResizablePanel>

            {/* Resizable handle */}
            <ResizableHandle withHandle className="bg-border" />

            {/* Code editor */}
            <ResizablePanel defaultSize={78} className="bg-background">
              <CodeEditor file={selectedFile} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>

        {/*<TabsContent value="editor" className="flex-1 p-0 mt-0">
          <div className="h-full">
            <CodeEditor file={selectedFile} />
          </div>
        </TabsContent>*/}
      </Tabs>
    </Card>
  );
}
