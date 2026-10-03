/**
 * An online (Cashfree) order exists as "pending" while the customer is paying, and "failed" if
 * the payment was cancelled/declined/expired. Those are NOT orders: they must never appear in the
 * customer's history, the admin Sales Receipts, the dashboard or revenue.
 * Everything else (paid online orders, counter sales, older orders in any status) stays visible.
 */
export const HIDDEN_PAYMENT_STATUSES = ["pending", "failed"];

export const isVisibleOrder = (o) => {
  const status = String(o?.payment_status ?? o?.paymentStatus ?? "").toLowerCase();
  const method = String(o?.payment_method ?? o?.paymentMethod ?? "").toLowerCase();
  return !(method === "cashfree" && HIDDEN_PAYMENT_STATUSES.includes(status));
};

/**
 * What the customer actually paid: subtotal - discount + shipping (the "Net Payable" on the receipt).
 * Counter bills store a `total` with GST added on top (2999 -> 3359) that the customer is never
 * charged, so `total` must not be used as the amount paid. Falls back to `total` for old rows
 * that have no subtotal.
 */
export const amountPaid = (o) => {
  const subtotal = Number(o?.subtotal) || 0;
  if (subtotal <= 0) return Number(o?.total) || 0;
  return Math.max(0, subtotal - (Number(o?.discount_amount) || 0) + (Number(o?.shipping_fee) || 0));
};
