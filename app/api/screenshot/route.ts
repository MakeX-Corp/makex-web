import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import puppeteer from "puppeteer";

// POST handler for taking screenshots
export async function POST(request: NextRequest) {
  // Authenticate
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;

  try {
    // Get URL from request body
    const body = await request.json();
    const { url, appId } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    // Launch a headless browser
    const browser = await puppeteer.launch({
      //headless: "new", // Use new headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      // Open a new page
      const page = await browser.newPage();

      // Set viewport to match mobile mockup dimensions
      await page.setViewport({
        width: 300,
        height: 580,
        deviceScaleFactor: 2, // For higher quality screenshots
      });

      // Navigate to the URL
      await page.goto(url, {
        waitUntil: "networkidle0", // Wait until network is idle
        timeout: 10000, // Timeout after 10 seconds
      });

      // Take the screenshot
      const screenshot = await page.screenshot({
        type: "png",
        encoding: "base64",
      });

      // Return the screenshot as a data URL
      return NextResponse.json({
        dataUrl: `data:image/png;base64,${screenshot}`,
      });
    } finally {
      // Make sure browser is closed even if there's an error
      await browser.close();
    }
  } catch (error) {
    console.error("Screenshot error:", error);
    return NextResponse.json(
      { error: "Failed to capture screenshot" },
      { status: 500 }
    );
  }
}
