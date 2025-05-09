"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { FOOTER_AND_HEADER_PATHS } from "@/const/const";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Header() {
    const pathname = usePathname();
    const isFooterAndHeaderPath = FOOTER_AND_HEADER_PATHS.includes(pathname);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

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
                    
                    {/* Desktop navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Button variant="ghost" asChild>
                            <Link href="/about">About</Link>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/pricing">Pricing</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </div>
                    
                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleMobileMenu}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </Button>
                    </div>
                </div>
                
                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-2 space-y-2 pb-4">
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href="/about">About</Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href="/pricing">Pricing</Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button className="w-full justify-start" asChild>
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </div>
                )}
            </div>
        </nav>
    );
}
