import { NextResponse } from 'next/server'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

export async function getSupabaseWithUser(request: Request): Promise<
    | { supabase: SupabaseClient; user: User }
    | NextResponse
> {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null

    if (!token) {
        return NextResponse.json(
            { error: 'No authorization token provided' },
            { status: 401 }
        )
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` },
            },
        }
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return { supabase, user }
} 