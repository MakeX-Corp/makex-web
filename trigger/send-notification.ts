import { task } from "@trigger.dev/sdk/v3";
import { sendPushNotifications } from "@/utils/server/sendPushNotifications";

const LOG_PREFIX = "[Send Notification]";

export const sendNotification = task({
  id: "send-notification",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    userId: string;
    title: string;
    body: string;
    payload?: Record<string, any>;
  }) => {
    try {
      const {
        userId,
        title,
        body,
        payload: notificationPayload = {},
      } = payload;

      console.log(`${LOG_PREFIX} Starting notification send:`, {
        userId,
        title,
        body,
      });

      // Send push notification
      await sendPushNotifications({
        userId,
        title,
        body,
        payload: notificationPayload,
      });

      console.log(
        `${LOG_PREFIX} Notification sent successfully to user:`,
        userId
      );

      return {
        success: true,
        userId,
        title,
        body,
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Error sending notification:`, error);
      throw error;
    }
  },
});
