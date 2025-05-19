import { NextRequest, NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
type Node =
  | { type: "file"; name: string; path: string; language: string; size: number }
  | { type: "folder"; name: string; path: string };

const REPO: Record<string, Node[]> = {
  "/": [
    { type: "folder", name: "src", path: "/src" },
    { type: "folder", name: "assets", path: "/assets" },
    {
      type: "file",
      name: "README.md",
      path: "/README.md",
      language: "markdown",
      size: 80,
    },
  ],
  "/src": [
    {
      type: "file",
      name: "index.tsx",
      path: "/src/index.tsx",
      language: "typescript",
      size: 120,
    },
    {
      type: "file",
      name: "utils.ts",
      path: "/src/utils.ts",
      language: "typescript",
      size: 60,
    },
  ],
  "/assets": [
    {
      type: "file",
      name: "logo.png",
      path: "/assets/logo.png",
      language: "binary",
      size: 245_000,
    },
  ],
};

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "/";
  //const list = REPO[path] ?? [];

  const api_url = "http://localhost:8001";

  const fileClient = createFileBackendApiClient(api_url);

  const data = await fileClient.get(`/repo?path=${path}`);

  return NextResponse.json(data);
}
