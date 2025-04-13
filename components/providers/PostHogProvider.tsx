"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { PostHogProvider as Provider } from "posthog-js/react";

function PostHogContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY || "", {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "",
      autocapture: true,
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

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider apiKey={process.env.NEXT_PUBLIC_POSTHOG_API_KEY || ""}>
      <PostHogContent />
      {children}
    </Provider>
  );
}