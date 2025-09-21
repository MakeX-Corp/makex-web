"use client";

import Image from "next/image";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <div
      className={`flex flex-col items-center text-center ${className || ""}`}
    >
      <div className="flex items-center justify-center mb-1">
        <div className="relative">
          <Image
            src="/logo.png"
            alt="MakeX Logo"
            width={48}
            height={48}
            className="h-12 w-12 md:h-16 md:w-16"
          />
        </div>
      </div>

      <h1 className="text-3xl md:text-7xl font-bold tracking-tight mb-2 md:mb-4 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
        MakeX
      </h1>

      <p className="text-lg md:text-2xl text-muted-foreground max-w-[600px] mb-4 md:mb-8 animate-fade-in-delay">
        Turn ideas into apps. Instantly.
      </p>
    </div>
  );
}
