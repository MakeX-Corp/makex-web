/**
 * Generate a unique share ID for app listings
 */
export async function generateShareId(
  supabase: any,
  appId?: string | null,
): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const maxAttempts = 3;

  // Add timestamp component (last 4 digits of current timestamp)
  const timestamp = Date.now().toString().slice(-4);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let result = "";

    if (appId) {
      // For regular apps: use appId as seed for deterministic generation
      const seed = appId
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);

      // Generate 6 characters using the seed and attempt number
      for (let i = 0; i < 6; i++) {
        const index = (seed + i * 31 + attempt * 17) % characters.length;
        result += characters[index];
      }
    } else {
      // For external apps: use random generation
      for (let i = 0; i < 6; i++) {
        const index =
          (Math.random() * characters.length + attempt * 17) %
          characters.length;
        result += characters[Math.floor(index)];
      }
    }

    // Combine with timestamp
    const shareId = `${result}${timestamp}`;

    // Check if this ID already exists
    const { data: existingMapping } = await supabase
      .from("app_listing_info")
      .select("share_id")
      .eq("share_id", shareId)
      .single();

    if (!existingMapping) {
      return shareId;
    }
  }

  // If all attempts failed, generate a completely random ID
  let randomId = "";
  for (let i = 0; i < 6; i++) {
    randomId += characters[Math.floor(Math.random() * characters.length)];
  }
  return `${randomId}${timestamp}`;
}
