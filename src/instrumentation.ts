import * as Sentry from "@sentry/nextjs";

/**
 * Instrumentation server-side y edge. Se ejecuta una vez al arrancar Next.
 * Si SENTRY_DSN está vacío, Sentry no envía nada (modo no-op).
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      sendDefaultPii: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      sendDefaultPii: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
