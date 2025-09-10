import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { readFile, writeFile, deleteFile } from "@/utils/server/e2b";

export async function GET(req: NextRequest) {
  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;

  const { supabase, user } = userResult;

  const encodedPath = req.nextUrl.searchParams.get("path") ?? "";
  const path = decodeURIComponent(encodedPath);
  const appId = req.nextUrl.searchParams.get("appId") ?? "";

  if (!appId || !path) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const { data: sandboxData, error: sandboxError } = await supabase
      .from("user_sandboxes")
      .select("sandbox_id")
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (sandboxError || !sandboxData?.sandbox_id) {
      return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
    }

    const sandboxId = sandboxData.sandbox_id;

    const fileContent = await readFile(sandboxId, path);

    const transformedData = {
      type: "text",
      code:
        typeof fileContent === "string"
          ? fileContent
          : JSON.stringify(fileContent, null, 2),
    };

    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error("File operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform file operation" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { appId, path, content } = await req.json();

  if (!appId || !path) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;
  const { supabase, user } = userResult;

  try {
    const { data: sandboxData, error: sandboxError } = await supabase
      .from("user_sandboxes")
      .select("sandbox_id")
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (sandboxError || !sandboxData?.sandbox_id) {
      return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
    }

    const sandboxId = sandboxData.sandbox_id;

    const responseData = await writeFile(sandboxId, path, content || "");
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("File operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform file operation" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { appId, path } = await req.json();
  const userResult = await getSupabaseWithUser(req as NextRequest);
  if (userResult instanceof NextResponse || "error" in userResult)
    return userResult;
  const { supabase, user } = userResult;

  try {
    const { data: sandboxData, error: sandboxError } = await supabase
      .from("user_sandboxes")
      .select("sandbox_id")
      .eq("app_id", appId)
      .eq("user_id", user.id)
      .single();

    if (sandboxError || !sandboxData?.sandbox_id) {
      return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
    }

    const sandboxId = sandboxData.sandbox_id;

    const responseData = await deleteFile(sandboxId, path);
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("File operation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform file operation" },
      { status: 500 },
    );
  }
}
