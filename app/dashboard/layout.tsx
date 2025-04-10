import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import Link from "next/link"
import { CreditCard } from "lucide-react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <SidebarProvider>
          <AppSidebar>
            {/* Add Paddle-related navigation links */}
            <Link 
              href="/pricing" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pricing</span>
            </Link>

            <Link 
              href="/account/billing" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </Link>
          </AppSidebar>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarProvider>
      </div>
    </div>
  )
}
