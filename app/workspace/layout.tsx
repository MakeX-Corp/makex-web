import { AppSidebar } from "@/components/app-sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full overflow-hidden">
      <AppSidebar />
      <div className="flex-1 min-h-screen overflow-auto">{children}</div>
    </div>
  );
}
