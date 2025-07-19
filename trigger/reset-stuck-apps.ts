import { task } from "@trigger.dev/sdk/v3";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";

export const resetStuckApps = task({
  id: "reset-stuck-apps",
  run: async () => {
    const supabase = await getSupabaseAdmin();
    
    // Define intermediate states that apps shouldn't be stuck in for more than 10 minutes
    const stuckStates = ["starting", "loading", "rendering", "bundling", "changing"];
    
    // Get the timestamp for 10 minutes ago
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    console.log("[resetStuckApps] Checking for apps stuck in intermediate states...");
    
    // Find apps that have been in intermediate states for more than 10 minutes
    const { data: stuckApps, error: queryError } = await supabase
      .from("user_sandboxes")
      .select("id, app_id, app_status, updated_at")
      .in("app_status", stuckStates)
      .lt("updated_at", tenMinutesAgo.toISOString());
    
    if (queryError) {
      console.error("[resetStuckApps] Error querying stuck apps:", queryError);
      throw new Error(`Failed to query stuck apps: ${queryError.message}`);
    }
    
    if (!stuckApps || stuckApps.length === 0) {
      console.log("[resetStuckApps] No stuck apps found");
      return { resetCount: 0 };
    }
    
    console.log(`[resetStuckApps] Found ${stuckApps.length} stuck apps:`, stuckApps);
    
    // Reset all stuck apps to "active" status
    const { error: updateError } = await supabase
      .from("user_sandboxes")
      .update({ 
        app_status: "active",
        updated_at: new Date().toISOString()
      })
      .in("id", stuckApps.map(app => app.id));
    
    if (updateError) {
      console.error("[resetStuckApps] Error resetting stuck apps:", updateError);
      throw new Error(`Failed to reset stuck apps: ${updateError.message}`);
    }
    
    console.log(`[resetStuckApps] Successfully reset ${stuckApps.length} stuck apps to active`);
    
    return { 
      resetCount: stuckApps.length,
      resetApps: stuckApps.map(app => ({
        id: app.id,
        app_id: app.app_id,
        previousStatus: app.app_status
      }))
    };
  },
});