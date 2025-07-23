import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

/*
import axios from "axios";
async function saveFile(apiUrl: string, path: string, content: string) {
  const response = await axios.post(
    apiUrl + "/file",
    {
      path: path,
      content: content,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "JCFQeB0lVMmaRejapxNeh4YvkzLogYmj",
      },
    }
  );

  console.log("✅ Response:", response.status, response.data);
}
  */
export async function POST(req: Request) {
  try {
    const { apiUrl, path, content } = await req.json();

    if (!apiUrl || !path || typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userResult = await getSupabaseWithUser(req as NextRequest);
    if (userResult instanceof NextResponse || "error" in userResult)
      return userResult;
    const { user } = userResult;

    try {
      console.log("apiUrl", apiUrl);
      const client = createFileBackendApiClient(apiUrl);

      console.log("client", client);
      console.log("path", path);
      console.log("content", content);
      //get the path without the leading slash
      const sanitizedPath = path.replace(/^\/+/, "");
      const responseData = await client.post("/file", {
        path: sanitizedPath,
        content,
      });

      //console.log("responseData", responseData);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error("Save file error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to save file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
