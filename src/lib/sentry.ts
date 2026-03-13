/**
 * Sentry error tracking integration
 *
 * To enable Sentry:
 * 1. Install: pnpm add @sentry/react
 * 2. Add VITE_SENTRY_DSN to your .env file
 * 3. Call initSentry() in your main.tsx
 */

import { logger } from "./logger";

type SentryConfig = {
  dsn?: string;
  environment?: string;
  enabled?: boolean;
};

let isInitialized = false;

export function initSentry(config?: SentryConfig) {
  if (isInitialized) {
    logger.warn("[Sentry] Already initialized");
    return;
  }

  const dsn = config?.dsn || import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    logger.warn("[Sentry] DSN not configured. Error tracking disabled.");
    return;
  }

  try {
    // Dynamic import to avoid bundling Sentry if not configured
    import("@sentry/react").then((Sentry) => {
      Sentry.init({
        dsn,
        environment: config?.environment || import.meta.env.MODE,
        enabled: config?.enabled !== false,

        // Performance Monitoring
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 0.3,

        // Session Replay
        replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
        replaysOnErrorSampleRate: 1.0,

        // Integrations
        integrations: [
          Sentry.replayIntegration(),
          Sentry.browserTracingIntegration(),
        ],

        // Before send hook for filtering sensitive data
        beforeSend(event, hint) {
          // Filter out known non-actionable errors
          const errorMessage = event.message?.toLowerCase() || "";
          if (errorMessage.includes("network error") && !navigator.onLine) {
            logger.debug("[Sentry] Skipping offline error");
            return null;
          }
          return event;
        },
      });

      isInitialized = true;
      logger.info("[Sentry] Initialized successfully");
    }).catch((error) => {
      logger.error("[Sentry] Failed to initialize:", error);
    });
  } catch (error) {
    logger.error("[Sentry] Initialization error:", error);
  }
}

export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>,
) {
  if (!isInitialized) {
    logger.error("[Sentry] Not initialized. Error:", error);
    return;
  }

  try {
    import("@sentry/react").then((Sentry) => {
      if (context) {
        Sentry.setContext("custom", context);
      }
      Sentry.captureException(error);
    });
  } catch (err) {
    logger.error("[Sentry] Failed to capture exception:", err);
  }
}

export function captureMessage(
  message: string,
  level?: "info" | "warning" | "error",
) {
  if (!isInitialized) {
    logger.warn("[Sentry] Not initialized. Message:", message);
    return;
  }

  try {
    import("@sentry/react").then((Sentry) => {
      Sentry.captureMessage(message, level);
    });
  } catch (err) {
    logger.error("[Sentry] Failed to capture message:", err);
  }
}

export function setUser(
  user: { id?: string; email?: string; username?: string } | null,
) {
  if (!isInitialized) return;

  try {
    import("@sentry/react").then((Sentry) => {
      if (user) {
        Sentry.setUser(user);
      } else {
        Sentry.setUser(null);
      }
    });
  } catch (err) {
    logger.error("[Sentry] Failed to set user:", err);
  }
}

export default { initSentry, captureException, captureMessage, setUser };
