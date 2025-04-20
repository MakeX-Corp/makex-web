import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js Chat App with Sidebar",
  description: "A Next.js application with a chat interface and sidebar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AppProvider>
          <div className="flex h-full overflow-hidden">
            <AppSidebar />
            <div className="flex-1 min-h-screen overflow-auto">{children}</div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
