import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { tasks } from "@trigger.dev/sdk";
import "@/trigger/create-external-listing";

interface DeployRequest {
  appId: string | null;
  type?: "web" | "mobile" | "external";
  deployData?: {
    category: string;
    description: string;
    tags: string[];
    icon: string;
    isPublic: boolean;
    aiGeneratedDetails: boolean;
    aiGeneratedIcon: boolean;
    importUrl?: string;
  };
}

export async function POST(req: Request) {
  const { appId, type = "web", deployData }: DeployRequest = await req.json();
  const result = await getSupabaseWithUser(req as NextRequest);
  //@ts-ignore
  const userEmail = result?.user?.email;

  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;

  if (type === "mobile") {
    tasks.trigger("deploy-eas", {
      appId,
      deployData,
    });
    return NextResponse.json({
      success: true,
      message: "Mobile deployment started in background",
    });
  } else if (type === "external") {
    // For external apps, just create the listing without deployment
    tasks.trigger("create-external-listing", {
      userEmail,
      deployData,
    });

    return NextResponse.json({
      success: true,
      message: "External app listing created successfully",
    });
  } else {
    tasks.trigger("deploy-web", {
      appId,
      userEmail,
      deployData,
    });

    return NextResponse.json({
      success: true,
      message: "Web deployment started in background",
    });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const appId = url.searchParams.get("appId");

  if (!appId) {
    return NextResponse.json(
      { error: "Missing appId parameter" },
      { status: 400 },
    );
  }

  const result = await getSupabaseWithUser(req);
  if (result instanceof NextResponse) return result;
  if ("error" in result) return result.error;
  const { supabase, user } = result;

  const { data: deployment, error } = await supabase
    .from("user_deployments")
    .select("*")
    .eq("app_id", appId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(null);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(deployment);
}
