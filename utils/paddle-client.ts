import { Paddle } from '@paddle/paddle-js';

export function initPaddle() {
  if (typeof window !== 'undefined') {
    const paddle = new Paddle({
      environment: 'sandbox', // Change to 'production' for live environment
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    });
    return paddle;
  }
  return null;
}
