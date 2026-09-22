/**
 * Standardized API Response Utilities
 */

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
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}
