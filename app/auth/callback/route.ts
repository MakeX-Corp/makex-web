import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { addToLoops } from "@/trigger/add-to-loops";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const source = requestUrl.searchParams.get("source");

  if (code) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);
    
    if (source === "signup" && session?.user?.email) {
      await addToLoops.trigger({ email: session.user.email });
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}