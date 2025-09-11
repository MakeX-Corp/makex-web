export const DEFAULT_LIMITS = {
  free: process.env.NODE_ENV === "development" ? 5000 : 5,
  starter: 250,
  pro: 500,
} as const;
