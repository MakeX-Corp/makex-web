'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"

export function Header() {
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // Redirect to home page after logout
  }

  return (
    <header className="border-b bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <Button
          variant="ghost"
          onClick={handleSignOut}
        >
          Logout
        </Button>
      </div>
    </header>
  )
} 