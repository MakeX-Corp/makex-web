import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  // Verify state parameter
  const storedState = localStorage.getItem('oauth_state')
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/error?message=Invalid state parameter', request.url))
  }
  
  try {
    // Exchange the authorization code for an access token
    const response = await fetch('https://api.supabase.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SUPABASE_OAUTH_CLIENT_ID}:${process.env.SUPABASE_OAUTH_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokens = await response.json()
    
    // Store the tokens securely (you might want to store these in a database)
    // tokens.access_token
    // tokens.refresh_token
    
    // Redirect to success page
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(new URL('/error?message=Authentication failed', request.url))
  }
}
