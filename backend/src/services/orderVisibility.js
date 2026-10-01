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
