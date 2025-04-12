// This file should be placed at the root of your app directory or src directory
// app/instrumentation-client.ts or src/instrumentation-client.ts

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0, // Adjust this value in production
  // Add any other client-specific config here from your sentry.client.config.ts

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// Export the router transition hook to instrument navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
