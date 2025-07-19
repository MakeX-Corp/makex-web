import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated (optional - could add admin check here)
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const supabase = await getSupabaseAdmin();
    
    // Define intermediate states that apps shouldn't be stuck in
    const stuckStates = ["starting", "loading", "rendering", "bundling", "changing"];
    
    // Get the timestamp for 5 minutes ago (more aggressive for manual reset)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    console.log("[resetStuckApps API] Checking for apps stuck in intermediate states...");
    
    // Find apps that have been in intermediate states for more than 5 minutes
    const { data: stuckApps, error: queryError } = await supabase
      .from("user_sandboxes")
      .select("id, app_id, app_status, updated_at")
      .in("app_status", stuckStates)
      .lt("updated_at", fiveMinutesAgo.toISOString());
    
    if (queryError) {
      console.error("[resetStuckApps API] Error querying stuck apps:", queryError);
      return NextResponse.json(
        { error: "Failed to query stuck apps", details: queryError.message },
        { status: 500 }
      );
    }
    
    if (!stuckApps || stuckApps.length === 0) {
      console.log("[resetStuckApps API] No stuck apps found");
      return NextResponse.json({ 
        message: "No stuck apps found",
        resetCount: 0 
      });
    }
    
    console.log(`[resetStuckApps API] Found ${stuckApps.length} stuck apps:`, stuckApps);
    
    // Reset all stuck apps to "active" status
    const { error: updateError } = await supabase
      .from("user_sandboxes")
      .update({ 
        app_status: "active",
        updated_at: new Date().toISOString()
      })
      .in("id", stuckApps.map(app => app.id));
    
    if (updateError) {
      console.error("[resetStuckApps API] Error resetting stuck apps:", updateError);
      return NextResponse.json(
        { error: "Failed to reset stuck apps", details: updateError.message },
        { status: 500 }
      );
    }
    
    console.log(`[resetStuckApps API] Successfully reset ${stuckApps.length} stuck apps to active`);
    
    return NextResponse.json({ 
      message: `Successfully reset ${stuckApps.length} stuck apps`,
      resetCount: stuckApps.length,
      resetApps: stuckApps.map(app => ({
        id: app.id,
        app_id: app.app_id,
        previousStatus: app.app_status
      }))
    });
    
  } catch (error) {
    console.error("[resetStuckApps API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}