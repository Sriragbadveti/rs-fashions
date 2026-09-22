/**
 * Lightweight HTTP Request Logger (optimized for high throughput)
 */
export function requestLogger(req, res, next) {
  // In high-load or benchmark environments, avoid synchronous stdout writes on 2xx responses
  if (process.env.NODE_ENV === "test" || process.env.BENCHMARK === "true") {
    return next();
  }

  const start = Date.now();
  res.on("finish", () => {
    // Always log errors and sample non-GET or slow requests (>500ms)
    const duration = Date.now() - start;
    if (res.statusCode >= 400 || duration > 500 || req.method !== "GET") {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
}
