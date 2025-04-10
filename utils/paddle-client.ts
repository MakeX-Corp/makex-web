import { initializePaddle } from '@paddle/paddle-js';

export function initPaddle() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return initializePaddle({
      environment: 'sandbox', // Change to 'production' for live environment
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
    });
  } catch (error) {
    console.error('Error initializing Paddle:', error);
    return null;
  }
}
