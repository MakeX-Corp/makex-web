export async function generateShareId(
  supabase: any,
  appId?: string | null,
): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const maxAttempts = 3;

  const timestamp = Date.now().toString().slice(-4);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let result = "";

    if (appId) {
      const seed = appId
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);

      for (let i = 0; i < 6; i++) {
        const index = (seed + i * 31 + attempt * 17) % characters.length;
        result += characters[index];
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const index =
          (Math.random() * characters.length + attempt * 17) %
          characters.length;
        result += characters[Math.floor(index)];
      }
    }

    const shareId = `${result}${timestamp}`;

    const { data: existingMapping } = await supabase
      .from("app_listing_info")
      .select("share_id")
      .eq("share_id", shareId)
      .single();

    if (!existingMapping) {
      return shareId;
    }
  }

  let randomId = "";
  for (let i = 0; i < 6; i++) {
    randomId += characters[Math.floor(Math.random() * characters.length)];
  }
  return `${randomId}${timestamp}`;
}
