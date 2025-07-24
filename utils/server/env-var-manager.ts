import { createFileBackendApiClient } from "./file-backend-api-client";

interface FilePayload {
  path: string;
  content?: string;
}

export class EnvVarManager {
  private static readonly ENV_PATH = ".env";
  private apiClient: ReturnType<typeof createFileBackendApiClient>;
  private envVars: Map<string, string>;

  private constructor(baseURL: string, envVars: Map<string, string>) {
    this.apiClient = createFileBackendApiClient(baseURL);
    this.envVars = envVars;
  }

  public static async create(baseURL: string): Promise<EnvVarManager> {
    const envVars = new Map<string, string>();
    const instance = new EnvVarManager(baseURL, envVars);
    await instance.loadEnvVars();
    return instance;
  }

  private async loadEnvVars(): Promise<void> {
    try {
      const content = await this.apiClient.get("/file", {
        path: EnvVarManager.ENV_PATH,
      });

      if (!content) {
        console.log("No .env file found, creating new one");
        // Create empty .env file
        await this.apiClient.post("/file", {
          path: EnvVarManager.ENV_PATH,
          content: "",
        });
        this.envVars = new Map();
        return;
      }

      const lines = content.split("\n");
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith("#")) {
          const [key, ...valueParts] = trimmedLine.split("=");
          const value = valueParts.join("=").trim();
          this.envVars.set(key.trim(), value);
        }
      }
    } catch (error) {
      console.warn("Error loading environment variables:");
      // Try to create the .env file if it doesn't exist
      try {
        await this.apiClient.post("/file", {
          path: EnvVarManager.ENV_PATH,
          content: "",
        });
        console.log("Created new .env file");
      } catch (createError) {
        console.error("Failed to create .env file:", createError);
      }
      this.envVars = new Map();
    }
  }

  private async saveEnvVars(): Promise<void> {
    try {
      const content = Array.from(this.envVars.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      const payload: FilePayload = {
        path: EnvVarManager.ENV_PATH,
        content: content,
      };

      await this.apiClient.post("/file", payload);
    } catch (error) {
      console.error("Error saving environment variables:", error);
      throw new Error("Failed to save environment variables");
    }
  }

  public async add(key: string, value: string): Promise<void> {
    this.envVars.set(key, value);
    await this.saveEnvVars();
  }

  public async delete(key: string): Promise<boolean> {
    const deleted = this.envVars.delete(key);
    if (deleted) {
      await this.saveEnvVars();
    }
    return deleted;
  }

  public async edit(key: string, newValue: string): Promise<void> {
    if (!this.envVars.has(key)) {
      throw new Error(`Environment variable ${key} does not exist`);
    }
    this.envVars.set(key, newValue);
    await this.saveEnvVars();
  }

  public async getAll(): Promise<Map<string, string>> {
    return new Map(this.envVars);
  }
}
