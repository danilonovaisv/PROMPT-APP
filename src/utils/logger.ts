import * as Sentry from "@sentry/react";
/**
 * Logger utility for consistent logging across the application
 * Replaces direct console.* calls with environment-aware logging
 */

interface Logger {
  debug: (msg: string, data?: unknown) => void;
  info: (msg: string, data?: unknown) => void;
  warn: (msg: string, data?: unknown) => void;
  error: (msg: string, error?: Error | unknown) => void;
}

const isDevelopment = import.meta.env.MODE === "development";

export const logger: Logger = {
  debug: (msg: string, data?: unknown) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${msg}`, data ?? "");
    }
  },

  info: (msg: string, data?: unknown) => {
    if (isDevelopment) {
      console.info(`[INFO] ${msg}`, data ?? "");
    }
  },

  warn: (msg: string, data?: unknown) => {
    console.warn(`[WARN] ${msg}`, data ?? "");
  },

  error: (msg: string, error?: Error | unknown) => {
    console.error(`[ERROR] ${msg}`, error ?? "");
    if (
      import.meta.env.PROD && error instanceof Error &&
      import.meta.env.VITE_SENTRY_DSN
    ) {
      Sentry.captureException(error, {
        extra: { msg },
      });
    } else if (
      import.meta.env.PROD && error !== undefined &&
      import.meta.env.VITE_SENTRY_DSN
    ) {
      Sentry.captureMessage(`[ERROR] ${msg}`, {
        extra: { error },
      });
    }
  },
};

/**
 * Creates a namespaced logger for specific modules
 * @param namespace - Module or component name
 */
export function createLogger(namespace: string) {
  return {
    debug: (msg: string, data?: unknown) =>
      logger.debug(`[${namespace}] ${msg}`, data),
    info: (msg: string, data?: unknown) =>
      logger.info(`[${namespace}] ${msg}`, data),
    warn: (msg: string, data?: unknown) =>
      logger.warn(`[${namespace}] ${msg}`, data),
    error: (msg: string, error?: Error | unknown) =>
      logger.error(`[${namespace}] ${msg}`, error),
  };
}
