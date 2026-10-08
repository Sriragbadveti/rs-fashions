/** Payment methods of online orders paid through a gateway. "cashfree" = historical orders. */
export const ONLINE_GATEWAY_METHODS = ["razorpay", "cashfree"];
export const isOnlineGatewayMethod = (method) => ONLINE_GATEWAY_METHODS.includes(String(method || "").toLowerCase());

/**
 * An online (gateway) order exists as "pending" while the customer is paying, and "failed" if
 * the payment was cancelled/declined/expired. Those are NOT orders: they must never appear in the
 * customer's history, the admin Sales Receipts, the dashboard or revenue.
 * Everything else (paid online orders, counter sales, older orders in any status) stays visible.
 */
export const HIDDEN_PAYMENT_STATUSES = ["pending", "failed"];

export const isVisibleOrder = (o) => {
  const status = String(o?.payment_status ?? o?.paymentStatus ?? "").toLowerCase();
  const method = String(o?.payment_method ?? o?.paymentMethod ?? "").toLowerCase();
  return !(isOnlineGatewayMethod(method) && HIDDEN_PAYMENT_STATUSES.includes(status));
};

/**
 * What the customer actually paid, nothing added. Online orders: the stored total IS the amount
 * the gateway charged (the payment is validated against it). Counter bills: the stored total has GST
 * added on top (2999 -> 3359) which the customer is never charged, so the tax is taken back off.
 */
export const amountPaid = (o) => {
  const total = Number(o?.total) || 0;
  if (total > 0) return Math.max(0, total - (Number(o?.cgst) || 0) - (Number(o?.sgst) || 0));
  return Math.max(0, (Number(o?.subtotal) || 0) - (Number(o?.discount_amount) || 0));
};
