import apn, { Notification } from "apn";
import { SupabaseClient } from "@supabase/supabase-js";

interface SendPushNotificationOptions {
  supabase: SupabaseClient;
  userId: string;
  title: string;
  body: string;
  payload?: Record<string, any>;
}

export async function sendPushNotifications({
  supabase,
  userId,
  title,
  body,
  payload = {},
}: SendPushNotificationOptions): Promise<void> {
  const { data: devices, error: deviceError } = await supabase
    .from("user_devices")
    .select("device_token")
    .eq("user_id", userId)
    .not("device_token", "is", null);

  if (deviceError) {
    console.error("❌ Failed to fetch device tokens:", deviceError);
    throw deviceError;
  }

  const deviceTokens = devices?.map((d) => d.device_token) || [];
  if (deviceTokens.length === 0) {
    console.warn("⚠️ No device tokens found for user:", userId);
    return;
  }

  const apnProvider = new apn.Provider({
    token: {
      key: `-----BEGIN PRIVATE KEY-----\n${process.env.APN_KEY_CONTENTS}\n-----END PRIVATE KEY-----`,
      keyId: process.env.APN_KEY_ID || "",
      teamId: process.env.APN_TEAM_ID || "",
    },
    production: true, //process.env.NODE_ENV === "production",
  });
  const notification = new Notification({
    alert: { title, body },
    topic: process.env.APN_BUNDLE_ID || "",
    sound: "default",
    payload,
  });

  for (const token of deviceTokens) {
    try {
      const result = await apnProvider.send(notification, token);
      console.log(`✅ Notification sent to ${token}:`, JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`❌ Error sending to ${token}:`, err);
    }
  }

  apnProvider.shutdown();
}
