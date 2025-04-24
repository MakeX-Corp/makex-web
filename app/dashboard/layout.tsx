import { AppSidebar } from "@/components/app-sidebar";
import { AppProvider } from "@/context/AppContext";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </AppProvider>
  );
}
