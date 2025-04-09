import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // First register with Loops.so
    const loopsResponse = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        source: 'waitlist',
        subscribed: true
      })
    })

    if (!loopsResponse.ok) {
      console.error('Failed to register with Loops.so:', await loopsResponse.text())
      throw new Error('Failed to register with email service')
    }

    // Then register with waitlist
    const waitlistResponse = await fetch('https://api.getwaitlist.com/api/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        waitlist_id: 26328,
        referral_link: request.headers.get('referer') || '',
      }),
    })

    const waitlistData = await waitlistResponse.json()

    if (!waitlistResponse.ok) {
      throw new Error(waitlistData.message || 'Failed to join waitlist')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 400 }
    )
  }
}