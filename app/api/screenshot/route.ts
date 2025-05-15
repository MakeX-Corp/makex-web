import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import crypto from 'crypto';

// Capture.page API credentials
const API_KEY = process.env.CAPTURE_API_KEY;
const API_SECRET = process.env.CAPTURE_API_SECRET;

console.log('API_KEY:', API_KEY);
console.log('API_SECRET:', API_SECRET);

// Function to generate request hash
function generateRequestHash(url: string): string {
  const encodedUrl = encodeURIComponent(url);
  const data = API_SECRET + 'url=' + encodedUrl;
  return crypto.createHash('md5').update(data).digest('hex');
}

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

    // Generate request hash
    const hash = generateRequestHash(url);
    const encodedUrl = encodeURIComponent(url);

    // Use Capture.page API to get the screenshot
    const captureUrl = `https://cdn.capture.page/${API_KEY}/${hash}/image?url=${encodedUrl}`;
    
    console.log('Attempting to capture screenshot from:', url);
    console.log('Using Capture.page URL:', captureUrl);
    console.log('Generated hash:', hash);
    console.log('Hash input:', API_SECRET + 'url=' + encodedUrl);

    // Fetch the image from Capture.page with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(captureUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'image/png'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Capture.page API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          hash: hash,
          hashInput: API_SECRET + 'url=' + encodedUrl
        });
        throw new Error(`Failed to capture screenshot: ${response.status} ${response.statusText}`);
      }

      // Convert the image to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      console.log('Successfully captured screenshot');

      // Return the screenshot as a data URL
      return NextResponse.json({
        dataUrl: `data:image/png;base64,${base64}`,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Screenshot capture timed out after 30 seconds');
      }
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error("Screenshot error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to capture screenshot",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
