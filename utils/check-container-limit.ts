import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function checkActiveContainer(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: activeContainers, error } = await supabase
    .from("user_apps")
    .select("*")
    .eq("user_id", userId)
    .or("status.is.null,status.neq.deleted");

  if (error) {
    return NextResponse.json(
      { error: "Failed to check active containers" },
      { status: 500 }
    );
  }

  const maxContainers = parseInt(
    process.env.MAX_CONTAINERS_PER_USER || "1",
    10
  );

  if (activeContainers && activeContainers.length >= maxContainers) {
    return NextResponse.json(
      {
        error: `Maximum container limit reached (${maxContainers})`,
        currentCount: activeContainers.length,
        maxAllowed: maxContainers,
      },
      { status: 400 }
    );
  }

  return activeContainers;
}
