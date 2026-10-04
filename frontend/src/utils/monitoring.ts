/**
 * Error monitoring (Sentry) for the website and admin panel.
 * The DSN is a public "send errors here" address (safe in browser code); set VITE_SENTRY_DSN to
 * override it, or to an empty string to switch monitoring off.
 * Customer details (phone, e-mail) are stripped before anything is sent.
 */
import * as Sentry from "@sentry/react";

const DEFAULT_DSN = "https://38ff94cfa7a518d5e5929a44489f0d6c@o4512197403869184.ingest.de.sentry.io/4512197429035088";

const PHONE_RE = /(?:\+?\d[\s-]?){10,13}/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
export const redactText = (v: unknown) => (typeof v === "string" ? v.replace(EMAIL_RE, "[email]").replace(PHONE_RE, "[phone]") : v);

// Errors that come from the visitor's browser or network, not from our code.
const IGNORED_MESSAGES = [
  "ResizeObserver loop",
  "Non-Error promise rejection captured",
  "Failed to fetch",
  "NetworkError when attempting to fetch resource",
  "Load failed",
  "AbortError",
  // Scripts injected by social apps' in-app browsers (Instagram, Facebook, TikTok...) into our page.
  // They talk to the app through window.webkit.messageHandlers, which a normal browser lacks.
  /webkit\.messageHandlers/,
  /_AutofillCallbackHandler/,
  /Java object is gone/,
];

export function scrubBrowserEvent<T extends Sentry.ErrorEvent>(event: T): T {
  if (event.request) {
    delete event.request.cookies;
    delete (event.request as { data?: unknown }).data;
    if (event.request.url) event.request.url = redactText(event.request.url) as string;
    if (typeof event.request.query_string === "string") event.request.query_string = redactText(event.request.query_string) as string;
  }
  if (event.user) event.user = { id: event.user.id };
  event.message = redactText(event.message) as string | undefined;
  for (const ex of event.exception?.values || []) ex.value = redactText(ex.value) as string | undefined;
  for (const b of event.breadcrumbs || []) {
    b.message = redactText(b.message) as string | undefined;
    if (b.data) delete b.data.body;
  }
  return event;
}

export function initMonitoring(): void {
  const env = ((import.meta as unknown as { env?: Record<string, string | boolean | undefined> }).env) || {};
  const configured = env.VITE_SENTRY_DSN as string | undefined;
  const dsn = String(configured ?? DEFAULT_DSN).trim();
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  // Production only: nothing is sent from local development or Vercel preview URLs.
  if (!dsn || !env.PROD || host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) return;

  Sentry.init({
    dsn,
    environment: "production",
    release: (env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined) || undefined,
    tracesSampleRate: 0.05,
    // Session replay is off: it would record customer screens and the free plan only has 50.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    ignoreErrors: IGNORED_MESSAGES,
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i, /^safari-extension:\/\//i],
    beforeSend: scrubBrowserEvent,
  });
  Sentry.setTag("app", window.location.pathname.startsWith("/admin") ? "admin" : "storefront");
}

export { Sentry };
