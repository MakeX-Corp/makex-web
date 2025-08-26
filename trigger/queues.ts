import { queue } from "@trigger.dev/sdk";

export const setupQueue = queue({
  name: "setup-queue",
  concurrencyLimit: 1,
});

export const criticalContainerSetupQueue = queue({
  name: "critical-container-setup",
  concurrencyLimit: 5,
});

export const autoKillContainersQueue = queue({
  name: "auto-kill-containers",
  concurrencyLimit: 3,
});

export const pauseContainerQueue = queue({
  name: "pause-container-queue",
  concurrencyLimit: 3,
});

export const autoPauseContainersQueue = queue({
  name: "auto-pause-containers-queue",
  concurrencyLimit: 1,
});
