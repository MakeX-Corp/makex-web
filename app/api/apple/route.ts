import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

function decodeBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

function parseJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { identityToken } = await req.json();
    if (!identityToken) {
      return NextResponse.json(
        { error: "Missing identityToken" },
        { status: 400 },
      );
    }

    const payload = parseJwtPayload(identityToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 },
      );
    }

    const expectedIssuer = "https://appleid.apple.com";
    const expectedAudience = "com.makex.app";

    const now = Math.floor(Date.now() / 1000);

    if (payload.iss !== expectedIssuer) {
      return NextResponse.json({ error: "Invalid issuer" }, { status: 401 });
    }

    if (payload.aud !== expectedAudience) {
      return NextResponse.json({ error: "Invalid audience" }, { status: 401 });
    }

    if (payload.exp && payload.exp < now) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const admin = await getSupabaseAdmin();

    const { data, error } = await admin.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      access_token: data?.session?.access_token,
      refresh_token: data?.session?.refresh_token,
      user: data?.user,
    });
  } catch (err: any) {
    console.error("Apple sign-in error:", err);
    return NextResponse.json(
      { error: "Apple sign-in failed", message: err.message },
      { status: 500 },
    );
  }
}
