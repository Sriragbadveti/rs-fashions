/**
 * Order statuses. Keep in sync with CANONICAL_ORDER_STATUSES in
 * backend/src/controllers/sales.controller.js (a test checks they match).
 *
 * The normal journey is   ordered -> confirmed -> packaging -> shipped -> delivered.
 * "refused_by_user" is for old Cash-on-Delivery orders. "cancelled" is not something the admin
 * picks from the status list: an order only becomes cancelled through the Cancel Order button
 * (which restores stock), and old cancelled orders keep showing it.
 * "new" is a legacy alias of "ordered".
 */
export type OrderStatus = "ordered" | "new" | "confirmed" | "packaging" | "shipped" | "delivered" | "refused_by_user" | "cancelled";

/** Every status the system understands (also what the backend accepts). */
export const ALL_ORDER_STATUSES: readonly OrderStatus[] = ["ordered", "confirmed", "packaging", "shipped", "delivered", "refused_by_user", "cancelled"];

/** The statuses an admin can choose from the dropdown, in order. */
export const SELECTABLE_ORDER_STATUSES: readonly OrderStatus[] = ["ordered", "confirmed", "packaging", "shipped", "delivered"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ordered: "Ordered",
  new: "Ordered",
  confirmed: "Order Confirmed",
  packaging: "Packaging",
  shipped: "Shipped",
  delivered: "Delivered",
  refused_by_user: "Refused by User",
  cancelled: "Cancelled",
};

// Badge/dropdown colors per status — shared so TrackOrder and TransactionHistory render identically.
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  ordered: "bg-purple-50 text-purple-700 border-purple-200",
  new: "bg-purple-50 text-purple-700 border-purple-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  packaging: "bg-amber-50 text-amber-700 border-amber-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refused_by_user: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-stone-100 text-stone-600 border-stone-300",
};

/** Maps any stored value (legacy "new", "processing", "refused"...) onto a canonical status. */
export function normalizeOrderStatus(raw: unknown): OrderStatus {
  const s = String(raw || "").toLowerCase().trim();
  if (s === "new") return "ordered";
  if (s === "processing") return "packaging";
  if (s === "refused") return "refused_by_user";
  return (ALL_ORDER_STATUSES as readonly string[]).includes(s) ? (s as OrderStatus) : "ordered";
}

/** Options for the status dropdown: the journey, plus the current status if it is outside it. */
export function statusOptionsFor(current: OrderStatus, paymentMethod?: string): OrderStatus[] {
  const options: OrderStatus[] = [...SELECTABLE_ORDER_STATUSES];
  if (String(paymentMethod || "").toLowerCase() === "cod") options.push("refused_by_user");
  const cur = current === "new" ? "ordered" : current;
  if (!options.includes(cur)) options.push(cur); // e.g. an already-cancelled order still shows "Cancelled"
  return options;
}
