/**
 * Keeps customer details out of Sentry: phone numbers, e-mail addresses and request bodies,
 * cookies and auth headers never leave the server.
 */
const PHONE_RE = /(?:\+?\d[\s-]?){10,13}/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export const redactText = (value) =>
  typeof value === "string" ? value.replace(EMAIL_RE, "[email]").replace(PHONE_RE, "[phone]") : value;

export function scrubEvent(event) {
  if (!event) return event;
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    if (event.request.headers) {
      for (const h of Object.keys(event.request.headers)) {
        if (/^(authorization|cookie|x-admin|x-api|x-webhook|x-cf)/i.test(h)) delete event.request.headers[h];
      }
    }
    if (typeof event.request.query_string === "string") event.request.query_string = redactText(event.request.query_string);
    if (typeof event.request.url === "string") event.request.url = redactText(event.request.url);
  }
  if (event.user) event.user = { id: event.user.id };
  event.message = redactText(event.message);
  for (const ex of event.exception?.values || []) ex.value = redactText(ex.value);
  for (const b of event.breadcrumbs || []) {
    b.message = redactText(b.message);
    if (b.data) delete b.data.body;
  }
  return event;
}
