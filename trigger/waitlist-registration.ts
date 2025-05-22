import { task } from "@trigger.dev/sdk/v3";

export const waitlistRegistration = task({
  id: "waitlist-registration",
  retry: {
    maxAttempts: 0,
  },
  run: async (payload: { email: string; referer?: string }) => {
    try {
      // First register with waitlist
      const waitlistResponse = await fetch('https://api.getwaitlist.com/api/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: payload.email,
          waitlist_id: 26328,
          referral_link: payload.referer || '',
        }),
      });

      const waitlistData = await waitlistResponse.json();
      console.log('waitlistData', waitlistData);

      if (!waitlistResponse.ok) {
        throw new Error(waitlistData.message || 'Failed to join waitlist');
      }

      // Then register with Loops.so
      const loopsResponse = await fetch('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: payload.email,
          source: 'waitlist',
          subscribed: true
        })
      });

      if (!loopsResponse.ok) {
        console.error('Failed to register with Loops.so:', await loopsResponse.text());
        throw new Error('Failed to register with email service');
      }

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
}); 