import { getSupabaseWithUser } from "@/utils/server/auth";
import { NextResponse } from "next/server";
import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    const { supabase, user } = result;
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const body = await request.json();
    const appId = body.appId;

    if (!appId) {
      console.error("appId is required");
      return NextResponse.json(
        { error: "appId is required" },
        { status: 400 }
      );
    }

    // Get user's Supabase integration credentials
    const { data: userIntegration, error: integrationError } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("integration_type", "supabase")
      .single();

    if (integrationError || !userIntegration) {
      return NextResponse.json(
        { error: "Supabase integration not found" },
        { status: 404 }
      );
    }

    const name = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: '-',
      style: 'lowerCase',
    });

    const db_password = crypto.randomBytes(16).toString('hex');

    // Create project using Supabase API
    const response = await fetch("https://api.supabase.com/v1/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userIntegration.access_token}`,
        "apikey": process.env.SUPABASE_OAUTH_CLIENT_SECRET!
      },
      body: JSON.stringify({
        name,
        organization_id: userIntegration.org_id,
        db_pass: db_password,
        region: "us-east-1",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Project creation error:", error);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: response.status }
      );
    }

    const project = await response.json();

    //u update user_apps table with the supabase_project json
    const { data, error } = await supabase
      .from("user_apps")
      .update({ supabase_project: project })
      .eq("user_id", user.id)
      .eq("id", appId);

    console.log("data", data);  
    console.log("error", error);

    console.log("project", project);
    return NextResponse.json(project);
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
