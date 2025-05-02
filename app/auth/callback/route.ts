import { NextResponse } from "next/server";
import { addToLoops } from "@/trigger/add-to-loops";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const source = requestUrl.searchParams.get("source");
  console.log("source", source);

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Code exchange error:", error);
        return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
      }
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Get user error:", userError);
      return NextResponse.redirect(new URL("/login?error=session", requestUrl.origin));
    }

    if (user?.email && source === "signup") {
      await addToLoops.trigger({ email: user.email });
    }

    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=unknown", requestUrl.origin));
  }
}
