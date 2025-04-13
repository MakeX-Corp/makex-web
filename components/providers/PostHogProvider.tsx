"use client";

import { useEffect, Suspense } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { PostHogProvider as Provider } from "posthog-js/react";

// Completely disable PostHog logging
if (typeof window !== "undefined") {
  // Save original console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console methods to filter PostHog logs
  console.log = function (...args) {
    if (typeof args[0] === "string" && args[0].includes("[PostHog")) return;
    originalLog.apply(console, args);
  };

  console.warn = function (...args) {
    if (typeof args[0] === "string" && args[0].includes("[PostHog")) return;
    originalWarn.apply(console, args);
  };

  console.error = function (...args) {
    if (typeof args[0] === "string" && args[0].includes("[PostHog")) return;
    originalError.apply(console, args);
  };
}

function PostHogContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY || "", {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "",
      autocapture: true,
      capture_pageview: false,
      capture_pageleave: true,
    });
  }, []);

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Check that PostHog is loaded
    if (typeof window !== "undefined") {
      posthog.capture("$pageview");
    }

    // Suppress PostHog debug messages in console
    const originalError = console.error;
    console.error = function(this: typeof console, ...args: Parameters<typeof console.error>) {
      if (typeof args[0] === "string" && args[0].includes("[PostHog")) return;
      originalError.apply(this, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogContent />
      </Suspense>
      {children}
    </>
  );
}