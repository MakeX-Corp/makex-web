import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, // Replace with your actual DSN

  // Adjust this value in production
  tracesSampleRate: 1.0,
});
