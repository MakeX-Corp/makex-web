// Animation and timing constants
export const ANIMATION_TIMINGS = {
  TYPING_SPEED: 200, // Typing animation speed in ms
  TYPING_INITIAL_DELAY: 2000, // Initial delay before typing starts
  SAVE_STATUS_TIMEOUT: 1500, // How long to show save status
  CONVEX_LOAD_DELAY: 8000, // Convex dashboard load delay
  EXPO_START_DELAY: 12000, // Expo start delay
} as const;

// API timeouts
export const API_TIMEOUTS = {
  CODE_VALIDATION_DELAY: 1000, // Code redemption validation delay
} as const;
