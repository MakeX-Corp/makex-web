import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function GET(request: NextRequest) {
  try {
    const result = await getSupabaseWithUser(request);
    if ("error" in result) return result.error;

    const { supabase, user } = result;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const appId = searchParams.get("appId");
    const appName = searchParams.get("appName");

    if (sessionId) {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 },
        );
      }

      return NextResponse.json(data);
    }

    let resolvedAppId = appId;

    if (!resolvedAppId && appName) {
      const { data: app, error } = await supabase
        .from("user_apps")
        .select("id")
        .eq("app_name", appName)
        .eq("user_id", user.id)
        .single();

      if (error || !app) {
        return NextResponse.json(
          { error: "App not found or unauthorized" },
          { status: 404 },
        );
      }

      resolvedAppId = app.id;
    }

    if (resolvedAppId) {
      const { data: sessions, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("app_id", resolvedAppId)
        .eq("user_id", user.id)
        .or("visible.is.null,visible.neq.false")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch chat sessions" },
          { status: 500 },
        );
      }

      return NextResponse.json(sessions);
    }

    return NextResponse.json(
      { error: "Must provide either sessionId, appId, or appName" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getSupabaseWithUser(request);
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const body = await request.json();
    const { appId, title, metadata } = body;

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 },
      );
    }

    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("id")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: "App not found or unauthorized" },
        { status: 404 },
      );
    }

    const { data: session, error: createError } = await supabase
      .from("chat_sessions")
      .insert({
        app_id: appId,
        user_id: user.id,
        title: title || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: "Failed to create chat session" },
        { status: 500 },
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await getSupabaseWithUser(request);
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabase
      .from("chat_sessions")
      .update({ visible: false })
      .eq("id", sessionId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to delete chat session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
