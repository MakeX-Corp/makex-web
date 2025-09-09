import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppProvider } from "@/context/app-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </AppProvider>
  );
}
