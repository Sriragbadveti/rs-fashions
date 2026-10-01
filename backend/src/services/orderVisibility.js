/**
 * An online order exists as "pending" while the customer is paying, and "failed" if the payment
 * was cancelled/declined/expired. Those are NOT orders: they must never appear in the customer's
 * order history, the admin Sales Receipts, the dashboard or revenue. Only paid (or counter/legacy)
 * orders are listed.
 */
export const HIDDEN_PAYMENT_STATUSES = ["pending", "failed"];

// PostgREST .or() filter: keep rows with no status (legacy) or any status except pending/failed.
export const VISIBLE_ORDERS_FILTER = `payment_status.is.null,payment_status.not.in.(${HIDDEN_PAYMENT_STATUSES.join(",")})`;

export const isVisibleOrder = (o) =>
  !HIDDEN_PAYMENT_STATUSES.includes(String(o?.payment_status ?? o?.paymentStatus ?? "").toLowerCase());
