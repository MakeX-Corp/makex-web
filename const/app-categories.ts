export const APP_CATEGORIES = [
  "Productivity",
  "Social",
  "Gaming",
  "Education",
  "Finance",
  "Health",
  "Entertainment",
  "Developer Tools",
  "Business",
  "Lifestyle",
] as const;

export type AppCategory = (typeof APP_CATEGORIES)[number];
