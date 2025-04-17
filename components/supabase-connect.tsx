'use client'

import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from "@/utils/client/auth"
import Image from 'next/image'

export function SupabaseConnect({ supabaseProject, setSupabaseProject }: { supabaseProject: any, setSupabaseProject: any }) {
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const router = useRouter()

  const handleCreateProject = async () => {
    try {
      setLoading(true)
      const appId = window.location.pathname.split('/')[2]
      const authToken = await getAuthToken()
      
      const response = await fetch('/api/integrations/supabase/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appId })
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const project = await response.json()
      setSupabaseProject(project)
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchUserIntegrations = async () => {
      try {
        const authToken = await getAuthToken()
        const response = await fetch('/api/integrations/supabase', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        const data = await response.json()
        if (data && data.exists) {
          setIsConnected(true)
        }
      } catch (error) {
        console.error('Error fetching Supabase integration:', error)
      } finally {
        setIsFetching(false)
      }
    }
    fetchUserIntegrations()
  }, [])

  

  const handleConnect = async () => {
    try {
      setLoading(true)
      
      // Generate a random state value for security
      const state = Math.random().toString(36).substring(7)

      // Get the app id from the url
      const appId = window.location.pathname.split('/')[2]
      
      const authToken = await getAuthToken()

      // Construct the authorization URL
      const authUrl = new URL('https://api.supabase.com/v1/oauth/authorize')
      authUrl.searchParams.append('client_id', process.env.NEXT_PUBLIC_SUPABASE_OAUTH_CLIENT_ID!)
      authUrl.searchParams.append('redirect_uri', `${window.location.origin}/api/integrations/supabase/callback?app_id=${appId}&auth_token=${authToken}`)
      authUrl.searchParams.append('response_type', 'code')
      authUrl.searchParams.append('state', state)
      authUrl.searchParams.append('scope', 'read write')
      
      // Use Next.js router for navigation
      router.push(authUrl.toString())
      
    } catch (error) {
      console.error('Error initiating OAuth flow:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {supabaseProject ? (
        <Button
          onClick={() => window.open(`https://supabase.com/dashboard/project/${supabaseProject?.id}`, '_blank')}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <Image
            src="/supabase-logo-icon.svg"
            alt="Supabase"
            width={20}
            height={20}
          />
          <span className="text-sm font-medium">
            {supabaseProject?.name || 'Supabase Project'}
          </span>
        </Button>
      ) : isConnected ? (
        <Button
          onClick={handleCreateProject}
          disabled={loading}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <Image
            src="/supabase-logo-icon.svg"
            alt="Supabase"
            width={20}
            height={20}
          />
          {loading ? 'Creating Project...' : 'Create New Project'}
        </Button>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={loading || isFetching}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <Image
            src="/supabase-logo-icon.svg"
            alt="Supabase"
            width={20}
            height={20}
          />
          {isFetching ? 'Loading...' : loading ? 'Connecting...' : isConnected ? 'Supabase Connected' : 'Connect with Supabase'}
        </Button>
      )}
    </div>
  )
}
