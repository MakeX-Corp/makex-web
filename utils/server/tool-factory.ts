import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import { createFileBackendApiClient } from "./file-backend-api-client";
import { getRelevantContext } from "./getRelevantContext";
import FirecrawlApp, { ScrapeResponse, Action } from "@mendable/firecrawl-js";
import { CONVEX_AUTH_DOCS } from "../docs/convex-auth-docs";

type ToolConfig = {
  apiUrl?: string;
};

export function createTools(config: ToolConfig = {}) {
  const apiClient = createFileBackendApiClient(config.apiUrl || "");
  const firecrawl = process.env.FIRECRAWL_API_KEY
    ? new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })
    : null;

  const tools: Record<string, any> = {
    readFile: tool({
      description: "Read contents of a file",
      inputSchema: z.object({
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
      inputSchema: z.object({
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
      inputSchema: z.object({
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
      inputSchema: z.object({
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
      inputSchema: z.object({
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

    writeFile: tool({
      description: "Write content to a file",
      inputSchema: z.object({
        path: z.string().describe("The path where to write the file"),
        content: z
          .string()
          .describe("The content to write to the file")
          .default(""),
      }),
      execute: async ({ path, content }) => {
        try {
          const data = await apiClient.post("/file", {
            path,
            content: content || "",
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
      inputSchema: z.object({
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

    editFile: tool({
      description: "Use Morph's Fast Apply API to make accurate code edits to an existing file",
      inputSchema: z.object({
        target_file: z.string().describe("The target file to modify"),
        instructions: z.string().describe("A single sentence instruction describing what you are going to do for the sketched edit. This is used to assist the less intelligent model in applying the edit. Use the first person to describe what you are going to do. Use it to disambiguate uncertainty in the edit."),
        code_edit: z.string().describe("Specify ONLY the precise lines of code that you wish to edit. NEVER specify or write out unchanged code. Instead, represent all unchanged code using the comment of the language you're editing in - example: // ... existing code ..."),
      }),
      execute: async ({ target_file, instructions, code_edit }) => {
        try {
          // First, read the current file content
          const currentFileData = await apiClient.get("/file", { path: target_file });
          const initialCode = currentFileData;

          // Use Morph's Fast Apply API to merge the edit
          const morphApiKey = process.env.MORPH_API_KEY;
          if (!morphApiKey) {
            return {
              success: false,
              error: "Morph API key not configured. Please set MORPH_API_KEY environment variable.",
            };
          }

          // Use OpenAI SDK with Morph's base URL
          const openai = new OpenAI({
            apiKey: morphApiKey,
            baseURL: "https://api.morphllm.com/v1",
          });

          const response = await openai.chat.completions.create({
            model: "morph-v3-fast",
            messages: [
              {
                role: "user",
                content: `<instruction>${instructions}</instruction>\n<code>${initialCode}</code>\n<update>${code_edit}</update>`,
              },
            ],
          });

          const data = response.choices[0].message.content;


          // Write the merged code back to the file
          const fileWriteRes = await apiClient.post("/file", {
            path: target_file,
            content: data,
          });

          console.log("Edit data",data)

          return { success: true, data };
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
      inputSchema: z.object({
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
      inputSchema: z.object({
        pattern: z.string().describe("The regex pattern to search for"),
        include_pattern: z
          .string()
          .describe("File pattern to include in search (e.g. '*.ts')")
          .default("*"),
        case_sensitive: z
          .boolean()
          .describe("Whether the search should be case sensitive")
          .default(false),
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

    getExpoDocumentation: tool({
      description:
        "Search the Expo documentation for relevant answers whenever you install expo related packages or need to know more about the expo ecosystem.",
      inputSchema: z.object({
        query: z.string().describe("The user's question or technical topic"),
      }),
      execute: async ({ query }) => {
        const context = await getRelevantContext(query, 5, "expo");
        return context.join("\n\n");
      },
    }),

    getOpenAIDocumentation: tool({
      description:
        "Search the OpenAI documentation when you need to integrate OpenAI APIs into your project for any AI features",
      inputSchema: z.object({
        query: z.string().describe("The user's question or technical topic"),
      }),
      execute: async ({ query }) => {
        const context = await getRelevantContext(query, 5, "openai");
        return context.join("\n\n");
      },
    }),

    getConvexDocumentation: tool({
      description:
        "Search the Convex documentation when you need to integrate Convex into your project for any backend functionalities",
      inputSchema: z.object({
        query: z.string().describe("The user's question or technical topic"),
      }),
      execute: async ({ query }) => {
        const context = await getRelevantContext(query, 5, "convex");
        return context.join("\n\n");
      },
    }),

    getConvexAuthDocs: tool({
      description:
        "Search the Convex documentation for relevant answers whenever you need to know more about the Convex authentication process",
      inputSchema: z.object({
        query: z.string().describe("The user's question or technical topic"),
      }),
      execute: async ({ query }) => {
        return CONVEX_AUTH_DOCS;
      },
    }),

    setupConvexAuth: tool({
      description:
        "Setup Convex authentication for your project but before you do that , make sure to install the dependencies first and then run this",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const command = "npx @convex-dev/auth --allow-dirty-git-state";
          const data = await apiClient.post("/command", { command });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    linterRun: tool({
      description: "Run the linter on specified file or directory",
      inputSchema: z.object({
        path: z
          .string()
          .describe("The file or directory path to lint")
          .optional(),
      }),
      execute: async ({ path }) => {
        try {
          console.log("Running linter on", path);
          path = ".";
          const command = path
            ? `npx eslint ${path} --fix --quiet`
            : "npx eslint . --fix --quiet";
          const data = await apiClient.post("/command", { command });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),

    scrapeWebContent: tool({
      description:
        "Scrape web content from a URL using Firecrawl and return it in a format suitable for AI processing whenever a url is provided",
      inputSchema: z.object({
        url: z.string().describe("The URL to scrape"),
        formats: z
          .array(
            z.enum([
              "markdown",
              "html",
              "rawHtml",
              "content",
              "links",
              "screenshot",
              "screenshot@fullPage",
              "extract",
              "json",
              "changeTracking",
            ]),
          )
          .describe("The formats to return")
          .default(["markdown"]),
        actions: z
          .array(
            z.object({
              type: z
                .enum([
                  "wait",
                  "click",
                  "write",
                  "press",
                  "scrape",
                  "screenshot",
                ])
                .describe("Action type"),
              milliseconds: z
                .number()
                .optional()
                .describe("Milliseconds to wait"),
              selector: z
                .string()
                .optional()
                .describe("CSS selector for click action"),
              text: z.string().optional().describe("Text to write"),
              key: z.string().optional().describe("Key to press"),
            }),
          )
          .optional()
          .describe("Actions to perform before scraping"),
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

    readLogs: tool({
      description:
        "Read log files: expo_logs.txt or convex_logs.txt. log_type: 'expo' or 'convex' (required).",
      inputSchema: z.object({
        log_type: z
          .enum(["expo", "convex"])
          .describe("Type of log file: 'expo' or 'convex' (required)"),
      }),
      execute: async ({ log_type }) => {
        console.log("[Tool Execution] Reading logs for", log_type);
        try {
          const data = await apiClient.get("/read_logs", { log_type });
          return { success: true, data };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Unknown error occurred",
          };
        }
      },
    }),
  };

  return tools;
}
