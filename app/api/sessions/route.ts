import { NextResponse } from 'next/server'
import { getSupabaseWithUser } from '@/utils/server/auth'

// GET /api/sessions - Get all chat sessions for a specific app
export async function GET(request: Request) {
    try {
        const result = await getSupabaseWithUser(request)
        if (result instanceof NextResponse) return result

        const { supabase, user } = result

        // Get the app ID from the URL
        const { searchParams } = new URL(request.url)
        const appId = searchParams.get('appId')

        if (!appId) {
            return NextResponse.json({ error: 'App ID is required' }, { status: 400 })
        }

        // Verify the app belongs to the user
        const { data: app, error: appError } = await supabase
            .from('user_apps')
            .select('id')
            .eq('id', appId)
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            return NextResponse.json({ error: 'App not found or unauthorized' }, { status: 404 })
        }

        // Get all chat sessions for this app
        const { data: sessions, error: sessionsError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('app_id', appId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (sessionsError) {
            return NextResponse.json(
                { error: 'Failed to fetch chat sessions' },
                { status: 500 }
            )
        }

        return NextResponse.json(sessions)
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

// POST /api/sessions - Create a new chat session
export async function POST(request: Request) {
    try {
        const result = await getSupabaseWithUser(request)
        if (result instanceof NextResponse) return result

        const { supabase, user } = result

        // Get the app ID from the request body
        const body = await request.json()
        const { appId, title, metadata } = body

        if (!appId) {
            return NextResponse.json({ error: 'App ID is required' }, { status: 400 })
        }

        // Verify the app belongs to the user
        const { data: app, error: appError } = await supabase
            .from('user_apps')
            .select('id')
            .eq('id', appId)
            .eq('user_id', user.id)
            .single()

        if (appError || !app) {
            return NextResponse.json({ error: 'App not found or unauthorized' }, { status: 404 })
        }

        // Create new chat session
        const { data: session, error: createError } = await supabase
            .from('chat_sessions')
            .insert({
                app_id: appId,
                user_id: user.id,
                title: title || null,
                metadata: metadata || null
            })
            .select()
            .single()

        if (createError) {
            return NextResponse.json(
                { error: 'Failed to create chat session' },
                { status: 500 }
            )
        }

        return NextResponse.json(session)
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
