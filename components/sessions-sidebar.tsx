import { Plus, MessageSquare, ArrowLeft } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

interface Session {
  id: string
  title: string
  created_at: string
}

interface SessionsSidebarProps {
  appId: string
  authToken: string
  sessions: Session[]
  setSessions: (sessions: Session[]) => void
  loading: boolean
  onCreateSession: () => Promise<void>
}

export function SessionsSidebar({ appId, authToken, sessions, setSessions, loading, onCreateSession }: SessionsSidebarProps) {
  const router = useRouter()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    new URLSearchParams(window.location.search).get('session')
  )

  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId)
    router.push(`/ai-editor/${appId}?session=${sessionId}`)
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/dashboard')}
                  className="h-8 w-8 p-0 hover:bg-transparent"
                  aria-label="Back to home"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              <span>Chat Sessions</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateSession}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading ? (
                  <>
                    <div className="px-4 py-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="px-4 py-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="px-4 py-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </>
                ) : !sessions || sessions.length === 0 ? (
                  <div key="empty" className="px-4 py-2 text-sm text-muted-foreground">No sessions yet</div>
                ) : (
                  sessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton 
                        onClick={() => handleSessionClick(session.id)}
                        className={session.id === activeSessionId ? "bg-primary/40 hover:bg-primary/15" : ""}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="truncate">{session.title || 'New Chat'}</span>
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