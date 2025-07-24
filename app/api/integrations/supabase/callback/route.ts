import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // log all params
  const code = searchParams.get("code");
  const appId = searchParams.get("app_id");
  if (!code) {
    return NextResponse.json({ error: "No authorization code received" }, { status: 400 });
  }

  if (!appId) {
    return NextResponse.json({ error: "No app id received" }, { status: 400 });
  }

  try {
    // Edit the request to add the auth token as header in bearer format because in incoming requets its in params
    const result = await getSupabaseWithUser(request as NextRequest);
    if (result instanceof NextResponse || "error" in result) return result;

    const { supabase, user } = result;
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch("https://api.supabase.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_SUPABASE_OAUTH_CLIENT_ID}:${process.env.SUPABASE_OAUTH_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/supabase/callback?app_id=${appId}`,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error("Token exchange error:", error);
      return NextResponse.json({ error: "Failed to exchange code for token" }, { status: 400 });
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token } = tokens;

    // get organisation
    const orgResponse = await fetch("https://api.supabase.com/v1/organizations", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log("orgResponse", orgResponse);

    if (!orgResponse.ok) {
      const error = await orgResponse.json();
      console.error("Organisation fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch organisation" }, { status: 400 });
    }

    const orgData = await orgResponse.json();
    const orgId = orgData[0].id;

    // check if user_integrations table has a row with user_id and integration_type
    const { data: userIntegration, error: userIntegrationError } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("integration_type", "supabase");

    if (userIntegration && userIntegration.length > 0) {
      // update the row
      const { data, error } = await supabase
        .from("user_integrations")
        .update({
          access_token,
          refresh_token,
          org_id: orgId,
        })
        .eq("user_id", user.id)
        .eq("integration_type", "supabase");

      if (error) {
        console.error("Error updating user_integrations table:", error);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/ai-editor/${appId}?integration_type=supabase&status=error`
        );
      }
    } else {
      // insert into user_integrations table
      const { data, error } = await supabase.from("user_integrations").insert({
        user_id: user.id,
        integration_type: "supabase",
        access_token,
        refresh_token,
        org_id: orgId,
      });

      if (error) {
        console.error("Error inserting into user_integrations table:", error);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/ai-editor/${appId}?integration_type=supabase&status=error`
        );
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ai-editor/${appId}?integration_type=supabase&status=success`
    );
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ai-editor/${appId}?integration_type=supabase&status=error`
    );
  }
}
