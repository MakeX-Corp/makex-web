"use client";

import { useEffect, Suspense } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";

// Disable PostHog completely in development
if (process.env.NODE_ENV === "development") {
  // Override posthog methods to do nothing
  (Object.keys(posthog) as Array<keyof typeof posthog>).forEach((key) => {
    if (typeof posthog[key] === 'function') {
      (posthog as any)[key] = () => {};
    }
  });
}

function PostHogContent() {
  // Do nothing in development
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  // Only initialize in production
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY || "", {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        debug: false,
        loaded: () => {},
        disable_session_recording: true,
        disable_persistence: true,
        advanced_disable_decide: true,
        bootstrap: { distinctID: "false" }, // Fix: boolean to string
        disable_compression: true,
        request_batching: false,
        enable_recording_console_log: false,
        mask_all_text: true,
        mask_all_element_attributes: true,
      });
    }
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Skip PostHog completely in development
  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <PostHogContent />
      </Suspense>
      {children}
    </>
  );
}
