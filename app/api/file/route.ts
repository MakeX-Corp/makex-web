import { NextRequest, NextResponse } from "next/server";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";
const CODE: Record<string, string> = {
  "/README.md": `# Demo Repo\nSelect a file from the sidebar.`,
  "/src/index.tsx": `export default function App() {
  return <h1>Hello Monaco!</h1>;
}`,
  "/src/utils.ts": `export const sum = (a: number, b: number) => a + b;`,
};

export async function GET(req: NextRequest) {
  /*
  const path = req.nextUrl.searchParams.get("path") ?? "";
  const blob = CODE[path];

  if (!blob) {
    return NextResponse.json({ error: "not a text file" }, { status: 415 });
  }

  // simulate latency
  await new Promise((r) => setTimeout(r, 300));
  return NextResponse.json({ code: blob });
  */
  const path = req.nextUrl.searchParams.get("path") ?? "";

  const api_url = "http://localhost:8001";

  const fileClient = createFileBackendApiClient(api_url);

  const data = await fileClient.get(`/code?path=${path}`);

  return NextResponse.json(data);
}
