import { DatabaseTool } from "@/utils/server/db-tools";
import { tool } from "ai";
import { z } from "zod";
import { createFileBackendApiClient } from "./file-backend-api-client";

type ToolConfig = {
  apiUrl?: string;
  connectionUri?: string;
};

export function createTools(config: ToolConfig = {}) {
  const apiClient = createFileBackendApiClient(config.apiUrl || "");
  const dbTool = new DatabaseTool();
  const connectionUri = config.connectionUri || undefined;
  const tools: Record<string, any> = {
    readFile: tool({
      description: "Read contents of a file",
      parameters: z.object({
        path: z.string().describe("The path to the file to read"),
      }),
      execute: async ({ path }) => {
        try {
          const data = await apiClient.get("/file", { path });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    listDirectory: tool({
      description: "List contents of a directory",
      parameters: z.object({
        path: z
          .string()
          .describe("The path to list contents from")
          .default("."),
      }),
      execute: async ({ path }) => {
        try {
          const data = await apiClient.get("/directory", { path });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    createDirectory: tool({
      description: "Create a new directory",
      parameters: z.object({
        path: z.string().describe("The path where to create the directory"),
      }),
      execute: async ({ path }) => {
        try {
          const data = await apiClient.post("/directory", { path });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    deleteDirectory: tool({
      description: "Delete a directory and its contents",
      parameters: z.object({
        path: z.string().describe("The path of the directory to delete"),
      }),
      execute: async ({ path }) => {
        try {
          const data = await apiClient.delete("/directory", { path });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    installPackages: tool({
      description: "Install yarn packages",
      parameters: z.object({
        packages: z
          .array(z.string())
          .describe("List of packages to install in an array"),
      }),
      execute: async ({ packages }) => {
        try {
          const data = await apiClient.post("/install/packages", {
            packages,
          });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    insertText: tool({
      description: "Insert text at a specific line in a file",
      parameters: z.object({
        path: z.string().describe("The path to the file"),
        insert_line: z
          .number()
          .describe("The line number where to insert the text"),
        new_str: z.string().describe("The text to insert"),
      }),
      execute: async ({ path, insert_line, new_str }) => {
        try {
          const data = await apiClient.put("/file/insert", {
            path,
            insert_line,
            new_str,
          });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    writeFile: tool({
      description: "Write content to a file",
      parameters: z.object({
        path: z.string().describe("The path where to write the file"),
        content: z.string().describe("The content to write to the file"),
      }),
      execute: async ({ path, content }) => {
        try {
          const data = await apiClient.post("/file", {
            path,
            content,
          });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    deleteFile: tool({
      description: "Delete a file",
      parameters: z.object({
        path: z.string().describe("The path of the file to delete"),
      }),
      execute: async ({ path }) => {
        try {
          const data = await apiClient.delete("/file", { path });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    replaceInFile: tool({
      description: "Replace text in a file",
      parameters: z.object({
        path: z.string().describe("The path to the file"),
        find: z.string().describe("The text to find"),
        replace_with: z.string().describe("The text to replace with"),
      }),
      execute: async ({ path, find, replace_with }) => {
        try {
          const response = await apiClient.put("/file/replace", {
            path,
            find,
            replace_with,
          });
          return { success: true, data: response.data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    getFileTree: tool({
      description: "Get the directory tree structure",
      parameters: z.object({
        path: z
          .string()
          .describe("The path to get the directory tree from")
          .default("."),
      }),
      execute: async ({ path }) => {
        try {
          const response = await apiClient.get("/file-tree", { path });
          return { success: true, data: response.data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),
  };

  // Add database tools if enabled
  if (connectionUri !== undefined) {
    tools.runSql = tool({
      description: "Run a sql query",
      parameters: z.object({
        query: z.string().describe("The sql query to run"),
      }),
      execute: async ({ query }) => {
        try {
          const result = await dbTool.execute(connectionUri, query);
          return { success: true, data: result };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    });
  }

  return tools;
}

// Example usage:
// const tools = createTools({ isDbEnabled: true }); // Includes all tools including runSql
// const tools = createTools({ isDbEnabled: false }); // Excludes runSql tool
