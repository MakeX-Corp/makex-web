export const DEFAULT_LIMITS = {
  free: process.env.NODE_ENV === "development" ? 5000 : 5, // 5 messages per day
  starter: 250, // 250 messages per month
  pro: 500, // 500 messages per month
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

export const CLAUDE_SONNET_4_MODEL = "us.anthropic.claude-sonnet-4-20250514-v1:0";
export const CLAUDE_3_5_SONNET_LATEST = "claude-3-5-sonnet-latest";