import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { Sandbox } from "@e2b/code-interpreter";
import fs from "fs";
import path from "path";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    const { supabase, user } = result;

    // Parse request body
    const body = await request.json();
    const { appId } = body;

    if (!appId) {
      return NextResponse.json(
        { error: "appId and app are required" },
        { status: 400 }
      );
    }

    let initialCommitHash = null;
    let sandboxId = null;

    // Get app data from Supabase
    const { data: appData, error: appError } = await supabase
      .from("user_apps")
      .select("*")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if(appData.sandbox_status == "active"){
      return NextResponse.json({ error: "Sandbox already exists" }, { status: 400 });
    }

    if (appError || !appData) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const appName = appData.app_name;

    console.log("appData", appData);

    if (appData.sandbox_id == null) {
      const sbx = await Sandbox.create("px2b0gc7d6r1svvz8g5t", {
        timeoutMs: 3600_000,
      });

      sandboxId = sbx.sandboxId;
      const apiHost = sbx.getHost(8001);
      await sbx.commands.run(
        `cd /app/expo-app && export EXPO_PACKAGER_PROXY_URL=https://${apiHost} && yarn expo start --port 8000`,
        { background: true }
      );
      const expoHost = sbx.getHost(8000);

      await redisUrlSetter(appName, `https://${expoHost}`, `https://${apiHost}`);

      try {
        const fileBackendClient = createFileBackendApiClient(
          `https://api-${appName}.makex.app`
        );
        const checkpointResponse = await fileBackendClient.post(
          "/checkpoint/save",
          {
            name: "initial-checkpoint",
            message: "Initial checkpoint",
          }
        );

        initialCommitHash =
          checkpointResponse.commit || checkpointResponse.current_commit;
      } catch (error) {
        console.error("Failed to save checkpoint:", error);
        return NextResponse.json(
          { error: "Failed to save checkpoint" },
          { status: 500 }
        );
      }
    } else {
      // Create folder path for the app in Supabase storage following the policy structure
      const filePath = `${user.id}/${appName}/${appName}.zip`;
      console.log("Trying path:", filePath);

      // Get the app zip file from Supabase storage
      const { data: zipData, error: zipError } = await supabase.storage
        .from("makex-apps")
        .download(filePath);


      if (zipError || !zipData) {
        console.error("App zip file not found");
        return NextResponse.json(
          {
            error: "App zip file not found",
            details: {
              path: filePath,
              error: zipError,
            },
          },
          { status: 404 }
        );
      }

      // Create a temporary file to store the zip
      const tempDir = "/tmp";
      const zipFilePath = path.join(tempDir, `${appName}.zip`);

      // Write the zip file to disk
      fs.writeFileSync(zipFilePath, Buffer.from(await zipData.arrayBuffer()));

      // Create a sandbox
      const sandbox = await Sandbox.create("px2b0gc7d6r1svvz8g5t", {
        timeoutMs: 3600_000,
      });

      sandboxId = sandbox.sandboxId;

      // // Upload the zip file to sandbox
      await sandbox.files.write("/app.zip", await zipData.arrayBuffer());

      // // Run commands to set up the environment
      await sandbox.commands.run(
        "sudo rm -rf /app/expo-app && sudo mkdir -p /app/expo-app && sudo unzip /app.zip -d /app/expo-app"
      );

      // Get hosts for the API and app
      const apiHost = sandbox.getHost(8001);

      // Start the Expo app in the background
      const runResult = await sandbox.commands.run(
        `cd /app/expo-app && sudo yarn && export EXPO_PACKAGER_PROXY_URL=https://${apiHost} && yarn expo start --port 8000`,
        { background: true }
      );

      const expoHost = sandbox.getHost(8000);
      // Connect to Redis for proxy configuration
      await redisUrlSetter(appName, `https://${expoHost}`, `https://${apiHost}`);

      // Clean up the temporary file
      if (fs.existsSync(zipFilePath)) {
        fs.unlinkSync(zipFilePath);
      }
    }

    // Update sandbox ID in the database
    const { error: updateError } = await supabase
      .from("user_apps")
      .update({
        sandbox_id: sandboxId,
        sandbox_status: "active",
        initial_commit: initialCommitHash,
      })
      .eq("id", appId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating sandbox info:", updateError);
    }


    // keep on curling the app url and until you find inhtml a script tag like this   <script src="/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable" defer></script>
    const appUrl = `https://${appName}.makex.app`;
    const apiUrl = `https://api-${appName}.makex.app`;

    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30; // Try for 30 seconds max

    while (!isReady && attempts < maxAttempts) {
      try {
        const appUrlResponse = await fetch(appUrl);
        const appUrlText = await appUrlResponse.text();
        const appUrlScript = appUrlText.match(/<script src="\/node_modules\/expo-router\/entry\.bundle\?platform=web&dev=true&hot=false&transform\.engine=hermes&transform\.routerRoot=app&unstable_transformProfile=hermes-stable" defer><\/script>/);
        
        if (appUrlScript) {
          console.log("App URL is ready");
          isReady = true;
        } else {
          console.log("App URL is not ready, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;
        }
      } catch (error) {
        console.log("Error checking app URL, retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    if (!isReady) {
      console.log("Timed out waiting for app URL to be ready");
    }
    
    return NextResponse.json({
      success: true,
      message: "App successfully loaded and started",
      app_url: `https://${appName}.makex.app`,
      api_url: `https://api-${appName}.makex.app`,
      sandbox_id: sandboxId,
    });
  } catch (error: any) {
    console.error("Sandbox error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process sandbox request" },
      { status: 500 }
    );
  }
}
