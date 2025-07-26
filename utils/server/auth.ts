import { NextRequest, NextResponse } from "next/server";
import {
  createClient as createTokenClient,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/utils/supabase/server";

type AuthResult =
  | { supabase: SupabaseClient<any>; user: User; token: string }
  | { error: NextResponse };

export async function getSupabaseWithUser(
  request: NextRequest,
): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // ✅ 1. Token-based (React Native / external clients)
  if (token) {
    const supabase = createTokenClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    );

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return {
        error: NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 },
        ),
      };
    }

    return { supabase, user: data.user, token };
  }

  // ✅ 2. Cookie-based (Next.js frontend)
  try {
    const supabase = await createCookieClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return {
        error: NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 },
        ),
      };
    }

    return { supabase, user: data.user, token: "cookie" };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      ),
    };
  }
}
