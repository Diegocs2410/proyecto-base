import pino, { type Logger } from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Logger central. Usa JSON en producción (parseable por Vercel/Datadog),
 * pretty en desarrollo. Redacta automáticamente campos sensibles.
 */
export const log: Logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  redact: {
    paths: [
      "password",
      "token",
      "access_token",
      "refresh_token",
      "api_key",
      "apiKey",
      "authorization",
      "*.password",
      "*.token",
      "*.access_token",
      "*.refresh_token",
      "*.api_key",
      "*.apiKey",
      "*.authorization",
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export function logger(scope: string): Logger {
  return log.child({ scope });
}
