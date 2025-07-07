import { NextResponse, NextRequest } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function GET(request: Request) {
  const result = await getSupabaseWithUser(request as NextRequest);

  if (result instanceof NextResponse || "error" in result) {
    return result;
  }

  const { user } = result;
  console.log("user", user);
  console.log("user.id", user.id);
  const admin = await getSupabaseAdmin();
  try {
    const { data } = await admin
      .from("mobile_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    console.log("data =====", data);
    const messagesLimit =
      data?.subscription_type === "makex_starter_plan" ? 250 : 20;
    const planName =
      data?.subscription_type === "makex_starter_plan" ? "Starter" : "Free";
    console.log("data?.subscription_status", data?.subscription_status);
    console.log("planName", planName);
    console.log("messagesLimit", messagesLimit);
    return NextResponse.json({
      hasActiveSubscription: data?.subscription_status === "active",
      messagesLimit: messagesLimit,
      planName: planName,
      nextBillingDate: data?.subscription_end, //could be null
      messagesUsed: data?.messages_used_this_period,
    });
  } catch (err) {
    console.error("Failed to fetch subscription:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
