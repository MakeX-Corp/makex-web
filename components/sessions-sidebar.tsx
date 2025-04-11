import { Plus, MessageSquare } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface Session {
  id: string
  title: string
  created_at: string
}

export function SessionsSidebar({ appId, authToken }: { appId: string, authToken: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/sessions?appId=${appId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        const data = await response.json()
        // Ensure data is an array, even if null/undefined
        setSessions(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching sessions:', error)
        setSessions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [appId])

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ appId }),
      })
      const newSession = await response.json()
      if (newSession) {
        setSessions(prev => [newSession, ...prev])
      }
    } catch (error) {
      console.error('Error creating new session:', error)
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>Chat Sessions</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={createNewSession}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  <div key="loading" className="px-4 py-2 text-sm text-muted-foreground">Loading sessions...</div>
                ) : !sessions || sessions.length === 0 ? (
                  <div key="empty" className="px-4 py-2 text-sm text-muted-foreground">No sessions yet</div>
                ) : (
                  sessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton asChild>
                        <a href={`/ai-editor/${appId}?session=${session.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">{session.title || 'New Chat'}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
} 