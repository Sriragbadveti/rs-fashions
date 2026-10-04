/**
 * Standardized API Response Utilities
 */
import * as Sentry from "@sentry/node";

export function successResponse(res, data = {}, message = "Success", statusCode = 200) {
  const payload = typeof data === "object" && data !== null ? data : { value: data };
  return res.status(statusCode).json({
    success: true,
    message,
    ...payload,
    data: payload,
  });
}

export function errorResponse(res, message = "Internal Server Error", statusCode = 500, errors = null) {
  // Server-side failures (5xx) are reported to Sentry unless the global handler already did.
  if (statusCode >= 500 && !res.locals?.errorReported) {
    try {
      Sentry.withScope((scope) => {
        const req = res.req;
        if (req) {
          scope.setTag("route", `${req.method} ${req.baseUrl || ""}${req.route?.path || ""}`);
        }
        Sentry.captureMessage(String(message), "error");
      });
    } catch {}
  }
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}
