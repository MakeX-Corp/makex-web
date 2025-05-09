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