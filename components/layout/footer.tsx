"use client";

import { usePathname } from "next/navigation";
import { FOOTER_AND_HEADER_PATHS } from "@/const";

export function Footer() {
  const pathname = usePathname();
  const isFooterAndHeaderPath = (
    FOOTER_AND_HEADER_PATHS as readonly string[]
  ).includes(pathname);

  if (!isFooterAndHeaderPath) return null;

  return (
    <footer className="py-8 border-t mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">© 2025 MakeX</div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground py-1">
              Terms
            </a>
            <a href="/privacy" className="hover:text-foreground py-1">
              Privacy
            </a>
            <a href="/refund" className="hover:text-foreground py-1">
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
