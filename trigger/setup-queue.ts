import { queue } from "@trigger.dev/sdk/v3";

export const setupQueue = queue({
  name: "setup-queue",
  concurrencyLimit: 1,
});
