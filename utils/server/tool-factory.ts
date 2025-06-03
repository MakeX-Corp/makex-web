import { DatabaseTool } from "@/utils/server/db-tools";
import { tool } from "ai";
import { z } from "zod";
import { createFileBackendApiClient } from "./file-backend-api-client";
import Exa from 'exa-js';
import { getRelevantContext } from "./getRelevantContext";
import FirecrawlApp, { ScrapeResponse, Action } from '@mendable/firecrawl-js';

type ToolConfig = {
  apiUrl?: string;
};

export function createTools(config: ToolConfig = {}) {
  const apiClient = createFileBackendApiClient(config.apiUrl || "");
  const dbTool = new DatabaseTool();
  const firecrawl = process.env.FIRECRAWL_API_KEY ? new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY }) : null;
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

    // replaceInFile: tool({
    //   description: "Replace text in a file",
    //   parameters: z.object({
    //     path: z.string().describe("The path to the file"),
    //     find: z.string().describe("The text to find"),
    //     replace_with: z.string().describe("The text to replace with"),
    //   }),
    //   execute: async ({ path, find, replace_with }) => {
    //     try {
    //       const response = await apiClient.put("/file/replace", {
    //         path,
    //         find,
    //         replace_with,
    //       });
    //       return { success: true, data: response.data };
    //     } catch (error: any) {
    //       return {
    //         success: false,
    //         error: error.message || "Unknown error occurred",
    //       };
    //     }
    //   },
    // }),

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
          return { success: true, data: response };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    grepSearch: tool({
      description: "Search for text patterns in files using regex",
      parameters: z.object({
        pattern: z.string().describe("The regex pattern to search for"),
        include_pattern: z.string().describe("File pattern to include in search (e.g. '*.ts')").default("*"),
        case_sensitive: z.boolean().describe("Whether the search should be case sensitive").default(false),
      }),
      execute: async ({ pattern, include_pattern, case_sensitive }) => {
        try {
          const data = await apiClient.post("/grep", {
            pattern,
            include_pattern,
            case_sensitive,
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

    getDocumentation: tool({
      description: "Search the Expo documentation for relevant answers whenever you install expo related packages or need to know more about the expo ecosystem.",
      parameters: z.object({
        query: z.string().describe("The user's question or technical topic"),
      }),
      execute: async ({ query }) => {
        const context = await getRelevantContext(query);
        return context.join("\n\n");
      },
    }),

    linterRun: tool({
      description: "Run the linter on specified file or directory",
      parameters: z.object({
        path: z.string().describe("The file or directory path to lint").optional(),
      }),
      execute: async ({ path }) => { 
        try {
          const command = path ? `npx eslint ${path} --fix` : "npx eslint . --fix";
          const data = await apiClient.post("/command", { command });
          return { success: true, data };
        } catch (error: any) {
          return { success: false, error: error.message || "Unknown error occurred" };
        }
      },
    }),

    scrapeWebContent: tool({
      description: "Scrape web content from a URL using Firecrawl and return it in a format suitable for AI processing whenever a url is provided",
      parameters: z.object({
        url: z.string().describe("The URL to scrape"),
        formats: z.array(z.enum(["markdown", "html", "rawHtml", "content", "links", "screenshot", "screenshot@fullPage", "extract", "json", "changeTracking"])).describe("The formats to return").default(["markdown"]),
        actions: z.array(z.object({
          type: z.enum(["wait", "click", "write", "press", "scrape", "screenshot"]).describe("Action type"),
          milliseconds: z.number().optional().describe("Milliseconds to wait"),
          selector: z.string().optional().describe("CSS selector for click action"),
          text: z.string().optional().describe("Text to write"),
          key: z.string().optional().describe("Key to press"),
        })).optional().describe("Actions to perform before scraping"),
      }),
      execute: async ({ url, formats, actions }) => {
        if (!firecrawl) {
          return {
            success: false,
            error: "Firecrawl API key not configured",
          };
        }

        try {
          const result = await firecrawl.scrapeUrl(url, {
            formats,
            actions: actions as Action[],
          });

          if (!result.success) {
            return {
              success: false,
              error: result.error || "Failed to scrape URL",
            };
          }
          console.log(result);

          return { success: true, data: result };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    webSearch: tool({
      description: "Search the web for real-time information and get up-to-date answers with citations",
      parameters: z.object({
        query: z.string().describe("The search query to find relevant information"),
      }),
    execute: async ({ query }) => {
        return {
          type: "web_search_20250305",
          name: "web_search",
          input: {
            query
          }
        };
      },
    }),

  };



  return tools;
}

// Example usage:
// const tools = createTools({ isDbEnabled: true }); // Includes all tools including runSql
// const tools = createTools({ isDbEnabled: false }); // Excludes runSql tool
