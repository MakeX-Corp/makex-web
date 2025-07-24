import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug session endpoint called");

    // Get all headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    console.log("📋 All request headers:", headers);

    // Try to get user session
    const result = await getSupabaseWithUser(request);

    if (result instanceof NextResponse) {
      console.log("❌ Auth failed - NextResponse returned");
      return NextResponse.json({
        error: "Authentication failed",
        type: "NextResponse",
        status: result.status,
        headers: headers,
      });
    }

    if ("error" in result) {
      console.log("❌ Auth error:", result.error);
      return NextResponse.json({
        error: "Authentication error",
        details: result.error,
        headers: headers,
      });
    }

    const { supabase, user, token } = result;
    console.log("✅ Auth successful");

    // Get session info
    const { data: sessionData } = await supabase.auth.getSession();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      token: {
        type: typeof token,
        value:
          token === "cookie" ? "cookie-based" : token?.substring(0, 50) + "...",
        full: token,
      },
      session: sessionData,
      headers: headers,
      message: "Use the 'full' token value in your curl commands",
    });
  } catch (error) {
    console.error("❌ Debug session error:", error);
    return NextResponse.json({
      error: "Debug session failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
