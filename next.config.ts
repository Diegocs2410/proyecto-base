import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

/**
 * withSentryConfig habilita source maps + auth con Sentry CLI en build.
 * Si SENTRY_AUTH_TOKEN no está configurado, Sentry CLI lo nota y omite
 * silenciosamente la subida de source maps (no rompe el build).
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  reactComponentAnnotation: { enabled: true },
  telemetry: false,
});
