import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import { Sandbox } from "@e2b/code-interpreter";
import fs from "fs";
import path from "path";
import { redisUrlSetter } from "@/utils/server/redis-client";
import { createFileBackendApiClient } from "@/utils/server/file-backend-api-client";

export const maxDuration = 300;

export async function POST(request: Request) {
  console.log("POST /api/sandbox/create: Request received");
  try {
    // Verify user authentication
    console.log("Verifying user authentication");
    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) {
      console.log("Authentication failed");
      return result;
    }
    const { supabase, user } = result;
    console.log("User authenticated:", user.id);

    // Parse request body
    const body = await request.json();
    const { appId } = body;
    console.log("Request body:", { appId });

    if (!appId) {
      console.log("appId is required");
      return NextResponse.json({ error: "appId is required" }, { status: 400 });
    }

    let initialCommitHash = null;
    let sandboxId = null;

    // Get app data from Supabase
    console.log("Fetching app data from Supabase for appId:", appId);
    const { data: appData, error: appError } = await supabase
      .from("user_apps")
      .select("*")
      .eq("id", appId)
      .eq("user_id", user.id)
      .single();

    if (appError || !appData) {
      console.log("App not found:", appError);
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    console.log("App data retrieved:", {
      id: appData.id,
      name: appData.app_name,
      sandbox_status: appData.sandbox_status,
    });

    if (appData.sandbox_status == "active") {
      console.log("Sandbox already exists for app:", appData.app_name);
      return NextResponse.json(
        { message: "Sandbox already exists" },
        { status: 200 }
      );
    }

    const appName = appData.app_name;

    console.log("appData", appData);

    if (appData.sandbox_id == null) {
      console.log("Creating new sandbox for app:", appName);
      const sbx = await Sandbox.create("px2b0gc7d6r1svvz8g5t", {
        timeoutMs: 3600_000,
      });

      sandboxId = sbx.sandboxId;
      console.log("Sandbox created with ID:", sandboxId);

      const apiHost = sbx.getHost(8001);
      const expoHost = sbx.getHost(8000);
      console.log("API host:", apiHost);
      console.log("Expo host:", expoHost);

      await redisUrlSetter(
        appName,
        `https://${expoHost}`,
        `https://${apiHost}`
      );
      console.log("Redis URLs set");

      try {
        console.log("Creating initial checkpoint for app:", appName);
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
        console.log("Checkpoint created with commit hash:", initialCommitHash);

        // Update sandbox ID in the database
        console.log("Updating sandbox info in database for app:", appId);
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
        } else {
          console.log("Sandbox info updated in database");
        }

        console.log("Setting Redis URLs for app:", appName);

        console.log("Starting Expo app in the sandbox");
        await sbx.commands.run(
          `cd /app/expo-app && export EXPO_PACKAGER_PROXY_URL=https://${expoHost} && yarn expo start --port 8000`,
          { background: true }
        );
        console.log("Expo app started in background");
  

      } catch (error) {
        console.error("Failed to save checkpoint:", error);
        return NextResponse.json(
          { error: "Failed to save checkpoint" },
          { status: 500 }
        );
      }
    } else {
      // Create a sandbox
      console.log("Creating sandbox");
      const sandbox = await Sandbox.create("px2b0gc7d6r1svvz8g5t", {
        timeoutMs: 3600_000,
      });

      // Update sandbox ID in the database
      console.log("Updating sandbox info in database for app:", appId);
      const { error: updateError } = await supabase
        .from("user_apps")
        .update({
          sandbox_id: sandboxId,
          sandbox_status: "active",
        })
        .eq("id", appId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating sandbox info:", updateError);
      } else {
        console.log("Sandbox info updated in database");
      }
      
      console.log("Processing existing app:", appName);
      // Create folder path for the app in Supabase storage following the policy structure
      const filePath = `${user.id}/${appName}/${appName}.zip`;

      console.log("Existing App");
      console.log("Trying path:", filePath);

      // Get the app zip file from Supabase storage
      console.log("Downloading app zip from Supabase storage");
      const { data: zipData, error: zipError } = await supabase.storage
        .from("makex-apps")
        .download(filePath);

      if (zipError || !zipData) {
        console.error("App zip file not found:", zipError);
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
      console.log("App zip file downloaded successfully");

      // Create a temporary file to store the zip
      const tempDir = "/tmp";
      const zipFilePath = path.join(tempDir, `${appName}.zip`);
      console.log("Creating temporary zip file at:", zipFilePath);

      // Write the zip file to disk
      fs.writeFileSync(zipFilePath, Buffer.from(await zipData.arrayBuffer()));
      console.log("Zip file written to disk");

      sandboxId = sandbox.sandboxId;
      console.log("Sandbox created with ID:", sandboxId);

      // // Upload the zip file to sandbox
      console.log("Uploading zip file to sandbox");
      await sandbox.files.write("/app.zip", await zipData.arrayBuffer());
      console.log("Zip file uploaded to sandbox");

      // // Run commands to set up the environment
      console.log("Extracting app from zip in sandbox");
      await sandbox.commands.run(
        "sudo rm -rf /app/expo-app && sudo mkdir -p /app/expo-app && sudo unzip /app.zip -d /app/expo-app"
      );
      console.log("App extracted in sandbox");

      // Get hosts for the API and app
      const apiHost = sandbox.getHost(8001);
      const expoHost = sandbox.getHost(8000);

      console.log("apiHost", apiHost);
      console.log("expoHost", expoHost);

      // Start the Expo app in the background
      console.log("Starting Expo app in sandbox");
      const runResult = await sandbox.commands.run(
        `cd /app/expo-app && sudo yarn && export EXPO_PACKAGER_PROXY_URL=https://${expoHost} && yarn expo start --port 8000`,
        { background: true }
      );
      console.log("Expo app started in background, result:", runResult);

      // Connect to Redis for proxy configuration
      console.log("Setting Redis URLs for app:", appName);
      await redisUrlSetter(
        appName,
        `https://${expoHost}`,
        `https://${apiHost}`
      );
      console.log("Redis URLs set");

      // Clean up the temporary file
      if (fs.existsSync(zipFilePath)) {
        console.log("Cleaning up temporary zip file");
        fs.unlinkSync(zipFilePath);
        console.log("Temporary zip file removed");
      }
    }

    // keep on curling the app url and until you find inhtml a script tag like this   <script src="/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable" defer></script>
    const appUrl = `https://${appName}.makex.app`;
    const apiUrl = `https://api-${appName}.makex.app`;
    console.log("Checking app readiness at URL:", appUrl);

    let isReady = false;
    let attempts = 0;
    const maxAttempts = 100; // Try for 30 seconds max

    while (!isReady && attempts < maxAttempts) {
      try {
        console.log(
          `Attempt ${attempts + 1}/${maxAttempts} to check app readiness`
        );
        const appUrlResponse = await fetch(appUrl);
        const appUrlText = await appUrlResponse.text();
        const appUrlScript = appUrlText.match(
          /<script src="\/node_modules\/expo-router\/entry\.bundle\?platform=web&dev=true&hot=false&transform\.engine=hermes&transform\.routerRoot=app&unstable_transformProfile=hermes-stable" defer><\/script>/
        );

        if (appUrlScript) {
          console.log("App URL is ready");
          isReady = true;
        } else {
          console.log("App URL is not ready, retrying...");
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;
        }
      } catch (error) {
        console.log("Error checking app URL, retrying:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    if (!isReady) {
      console.log(
        "Timed out waiting for app URL to be ready after",
        maxAttempts,
        "attempts"
      );
    }

    console.log("Returning success response with URLs:", {
      app_url: appUrl,
      api_url: apiUrl,
    });
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
