"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FOOTER_AND_HEADER_PATHS } from "@/const/const";

export function Header() {
    const pathname = usePathname();
    const isFooterAndHeaderPath = FOOTER_AND_HEADER_PATHS.includes(pathname);

    if (!isFooterAndHeaderPath) return null;
    return (
        <nav className="sticky top-0 left-0 right-0 backdrop-blur-sm z-50 bg-background/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="makeX logo"
                                width={100}
                                height={25}
                                className="h-8 w-auto"
                            />
                            <span className="text-sm font-medium">MakeX</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
