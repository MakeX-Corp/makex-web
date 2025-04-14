import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, // Replace with your actual DSN

  // Adjust this value in production, or use tracesSampleRate for greater accuracy
  tracesSampleRate: 1.0,

  // Setting this to true will enable profiling
  // Profiling helps identify performance issues
  profilesSampleRate: 1.0,
});
