/**
 * Error monitoring (Sentry). Imported first thing in server.js.
 * Off unless SENTRY_DSN is set, so local development and tests send nothing.
 */
import * as Sentry from "@sentry/node";
import { scrubEvent } from "./utils/sentryScrub.js";

const dsn = process.env.SENTRY_DSN;

if (dsn && process.env.NODE_ENV !== "test") {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "production",
    release: process.env.RENDER_GIT_COMMIT || process.env.SENTRY_RELEASE,
    sendDefaultPii: false,
    // Free plan: errors only, plus a small sample of request timings.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
    beforeSend: scrubEvent,
    ignoreErrors: ["Not allowed by CORS"],
  });
}

export { Sentry };
