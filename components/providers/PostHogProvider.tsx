"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize PostHog
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY || "", {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "",
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug();
      },
    });
  }, []);

  // Track page views
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

  return <>{children}</>;
}
