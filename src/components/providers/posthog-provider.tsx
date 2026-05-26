"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PostHogClientProvider } from "posthog-js/react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

if (typeof window !== "undefined" && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // lo manejamos manualmente para SPA
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: true,
  });
}

function CapturaPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PostHogClientProvider client={posthog}>
      <CapturaPageview />
      {children}
    </PostHogClientProvider>
  );
}
