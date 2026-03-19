import * as Sentry from "@sentry/react";
import React from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim();
const isDevelopment = import.meta.env.MODE === "development";

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: true,

    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    tracesSampleRate: 1.0,
    tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: !isDevelopment,
  });
} else {
  console.info(
    "Sentry desativado: VITE_SENTRY_DSN não configurado para este ambiente.",
  );
}
