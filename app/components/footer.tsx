"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  if (!isHomepage) return null;

  return (
    <footer className="py-8 border-t mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © 2025 MakeX
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/refund" className="hover:text-foreground">
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 