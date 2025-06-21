import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const authHeader = request.headers.get('Authorization');
  const hasBearerToken = authHeader && authHeader.startsWith('Bearer ');

  const pagesWithoutAuth = [
    '/login',
    '/auth/callback',
    '/signup',
    '/support',
    '/privacy',
    '/refund',
    '/about',
    '/pricing',
    '/api/share',
    '/api/newsletter-signup',
    '/newsletter',
  ]

  // Check if user is new (created after May 21, 2025)
  if (user) {
    const isNewUser = false
    
    // For new users, only allow access to specific pages
    if (isNewUser && 
        !pagesWithoutAuth.includes(request.nextUrl.pathname) &&
        !request.nextUrl.pathname.startsWith('/terms') &&
        !request.nextUrl.pathname.match(/^\/share\/[A-Za-z0-9]+$/) &&
        request.nextUrl.pathname !== '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Only redirect to dashboard if user is not new
    if (!isNewUser && request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (
    !user && !hasBearerToken &&
    !pagesWithoutAuth.includes(request.nextUrl.pathname) &&
    !request.nextUrl.pathname.startsWith('/terms') &&
    !request.nextUrl.pathname.match(/^\/share\/[A-Za-z0-9]+$/) &&
    request.nextUrl.pathname !== '/'
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}