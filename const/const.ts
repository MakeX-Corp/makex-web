export const DEFAULT_LIMITS = {
  free: process.env.FREE_LIMIT || "20", // 20 messages per month
  starter: process.env.STARTER_LIMIT || "250", // 250 messages per month
  pro: process.env.PRO_LIMIT || "500", // 500 messages per month
};

export const FOOTER_AND_HEADER_PATHS = [
  "/",
  "/about",
  "/pricing",
  "/login",
  "/signup",
  "/refund",
  "/privacy",
  "/terms",
];

export const CLAUDE_SONNET_4_MODEL = "anthropic/claude-4-sonnet";
export const CLAUDE_3_5_SONNET_LATEST = "claude-3-5-sonnet-latest";
