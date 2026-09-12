import { errorResponse } from "../utils/response.js";

/**
 * Global Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = err.message || "An unexpected server error occurred.";

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === "development" ? err.stack : null);
}
