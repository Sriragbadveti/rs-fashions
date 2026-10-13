/**
 * Storefront (online) orders are created on the SERVER before the customer pays, as
 * "ordered / payment pending", and are finalised (marked paid, stock deducted, customer updated)
 * by whichever server-checked confirmation arrives first: the Razorpay webhook or the browser's
 * signature-verified callback. This means a paid order exists even if the customer's browser died after
 * paying, and it appears in "My Orders" and the admin panel without anyone being on a page.
 */
import { supabase } from "../config/supabase.js";
import { saveOrderToStore, findOrderFromStore, markOrderPaidInStore, renumberOrderInStore } from "../database/localStore.js";
import {
  deductStockForOrderItems,
  findStockShortages,
  holdStock,
  releaseHolds,
  withStockLock,
} from "./inventory.service.js";
import { findExistingCustomer, phoneKey } from "./customerIdentity.js";
import { peekNextOrderNumber, withOrderNumberLock } from "./orderNumber.js";
import { recordPaymentAlert } from "./paymentStore.js";
import { invalidateCatalogCache } from "../controllers/catalog.controller.js";
import { invalidateBootstrapCache } from "../controllers/bootstrap.controller.js";
import { ONLINE_GATEWAY_METHODS } from "./orderVisibility.js";
import { computeFestivalOffer, loadFestivalOfferConfig, resolveCartProducts } from "./festivalOffer.js";
import { writeWithOptionalColumns } from "./optionalColumns.js";

// The signed-in account (e.g. a Google login) can differ from the phone/email typed at checkout;
// it is stored so the order still shows in that account's "My Orders". Newer than schema.sql.
const OPTIONAL_ORDER_COLUMNS = ["account_email"];
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
export const normalizeAccountEmail = (v) => {
  const e = String(v || "").trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
};

const ONLINE_HOLD_MS = 30 * 60 * 1000; // stock is held for the payment window
const STALE_PENDING_MS = 2 * 60 * 60 * 1000;
export const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9_-]{3,60}$/;

const holdOf = (notes) => /hold:([\w-]+)/.exec(String(notes || ""))?.[1] || null;

/**
 * Online orders get their sequential invoice number (001, 002…) only once the payment is confirmed.
 * Until then the order's number is a temporary reference equal to its id ("ord-…"), so an abandoned
 * checkout never uses up an invoice number. The reference keeps working after the order is
 * numbered (it stays the order's id), which matters because Razorpay's notes hold it.
 */
export const isTemporaryOrderRef = (key) => /^ord-[a-z0-9]+-[a-z0-9]+$/i.test(String(key || ""));
const isInvoiceNumber = (n) => /^\d+$/.test(String(n || "").trim());
const newOrderRef = () => `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Finds an order by its invoice number or by its id / temporary reference. */
export async function getOrder(orderKey) {
  const key = String(orderKey || "").trim();
  if (!ORDER_NUMBER_PATTERN.test(key)) return null;
  if (supabase) {
    const { data } = await supabase.from("orders").select("*")
      .or(`order_number.eq.${key},id.eq.${key}`).limit(1).maybeSingle();
    return data || null;
  }
  const o = findOrderFromStore(key);
  if (!o) return null;
  return {
    ...o,
    order_number: o.order_number || o.orderNumber || key,
    payment_status: o.payment_status || o.paymentStatus,
  };
}

/**
 * Gives a paid online order the next sequential invoice number (no-op if it already has one).
 * Runs under the order-number lock; the UNIQUE(order_number) constraint covers other instances.
 * Returns the invoice number, or null if it could not be assigned (the order stays paid).
 */
async function assignInvoiceNumber(order) {
  if (isInvoiceNumber(order.order_number)) return String(order.order_number);
  return withOrderNumberLock(async () => {
    if (!supabase) {
      const number = await peekNextOrderNumber();
      return renumberOrderInStore(order.id, number) ? number : null;
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const number = await peekNextOrderNumber();
      const { data, error } = await supabase.from("orders")
        .update({ order_number: number, invoice_number: number, updated_at: new Date().toISOString() })
        .eq("id", order.id).eq("order_number", order.order_number)
        .select("order_number").maybeSingle();
      if (!error) {
        if (data) return String(data.order_number);
        // Someone else numbered it meanwhile: read back the number it got.
        const { data: now } = await supabase.from("orders").select("order_number").eq("id", order.id).maybeSingle();
        return isInvoiceNumber(now?.order_number) ? String(now.order_number) : null;
      }
      if (error.code !== "23505") {
        console.warn("[OnlineOrders] invoice number not assigned:", error.message);
        return null;
      }
    }
    return null;
  });
}

/** POST /billing/pending-order — called by checkout right before the payment window opens. */
export async function createPendingOrder(body = {}) {
  const clientKey = String(body.orderNumber || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];
  const phone = body.customerPhone || body.phone;
  if (!ORDER_NUMBER_PATTERN.test(clientKey)) return { status: 400, body: { success: false, message: "A valid order number is required" } };
  if (!phone || items.length === 0) return { status: 400, body: { success: false, message: "Customer phone and at least one item are required" } };

  // A reference the server issued ("ord-…", or an older numeric order) is a retry of the same
  // order. Anything else is the browser's own key: the server creates the order and returns its
  // reference. The invoice number is only given once the payment is confirmed.
  const isIssued = isTemporaryOrderRef(clientKey) || /^\d{3,}$/.test(clientKey);
  const found = isIssued ? await getOrder(clientKey) : null;
  if (found && String(found.payment_status).toLowerCase() === "paid") {
    return { status: 200, body: { success: true, alreadyPaid: true, orderNumber: String(found.order_number) } };
  }
  // Only a still-unpaid order is updated; a closed (failed/cancelled) one is replaced by a new order.
  const existing = found && String(found.payment_status).toLowerCase() === "pending" ? found : null;
  let orderNumber = existing ? String(existing.order_number) : newOrderRef();

  // Festival offer: the discount the browser applied must be exactly what the server works out
  // from the stored prices/tags (it can't be inflated, and a switch-off/on mid-checkout is caught).
  const festival = computeFestivalOffer(await resolveCartProducts(items), await loadFestivalOfferConfig());
  const claimedFestival = Math.max(0, Number(body.festivalDiscount) || 0);
  if (Math.abs(claimedFestival - festival.discount) > 0.5) {
    return {
      status: 409,
      body: {
        success: false,
        code: "OFFER_CHANGED",
        message: festival.discount > 0
          ? `The ${festival.name} discount for your cart is ₹${festival.discount}. Please review your total.`
          : "The festival offer has ended. Please review your total.",
        festivalDiscount: festival.discount,
      },
    };
  }

  // Reserve the pieces for the whole payment window; refuse if someone else holds/bought them.
  const sessionId = String(body.sessionId || body.session_id || orderNumber);
  const shortages = await holdStock(items, sessionId, ONLINE_HOLD_MS);
  if (shortages.length > 0) {
    return { status: 409, body: { success: false, code: "INSUFFICIENT_STOCK", message: "Some items are no longer available in the requested quantity.", shortages } };
  }

  const row = {
    order_number: orderNumber,
    invoice_number: orderNumber,
    customer_name: body.customerName || body.customer_name || "Guest Customer",
    phone,
    email: body.customerEmail || body.email || null,
    account_email: normalizeAccountEmail(body.accountEmail),
    shipping_address: body.shipping_address || body.address || null,
    items,
    subtotal: Number(body.subtotal) || 0,
    cgst: 0,
    sgst: 0,
    shipping_fee: Number(body.shippingFee ?? body.shipping_fee) || 0,
    discount_amount: Number(body.discount ?? body.discount_amount) || 0,
    coupon_code: body.couponCode || null,
    total: Number(body.total) || 0,
    payment_method: "razorpay",
    payment_status: "pending",
    order_status: "ordered",
    billing_type: "gst",
    notes: `hold:${sessionId}${festival.discount > 0 ? ` festival:${festival.discount}` : ""}`,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    if (existing) {
      const { error } = await writeWithOptionalColumns("orders", row,
        (r) => supabase.from("orders").update(r).eq("id", existing.id).eq("payment_status", "pending"), OPTIONAL_ORDER_COLUMNS);
      if (error) throw error;
    } else {
      // New order: its id doubles as the temporary order reference until it is paid.
      const { error } = await writeWithOptionalColumns("orders", { id: orderNumber, ...row },
        (r) => supabase.from("orders").insert(r), OPTIONAL_ORDER_COLUMNS);
      if (error) throw error;
    }
    // Housekeeping: online orders never paid within 2 hours are closed.
    const cutoff = new Date(Date.now() - STALE_PENDING_MS).toISOString();
    const { data: stale } = await supabase.from("orders").select("order_number")
      .eq("payment_status", "pending").in("payment_method", ONLINE_GATEWAY_METHODS).lt("updated_at", cutoff);
    for (const o of stale || []) await voidUnpaidOrder(o.order_number);
  } else {
    saveOrderToStore({ id: existing?.id || orderNumber, ...row, paymentStatus: "pending", orderStatus: "ordered", orderNumber, invoiceNumber: orderNumber });
  }
  invalidateBootstrapCache();
  return { status: 201, body: { success: true, orderNumber, holdMinutes: 30 } };
}

async function upsertCustomer(order) {
  if (!supabase || !order.phone) return;
  try {
    // Same person = same phone (last 10 digits) or same email, however it was typed.
    const cust = await findExistingCustomer({ phone: order.phone, email: order.email });
    const total = Number(order.total) || 0;
    if (cust) {
      const patch = {
        total_spent: (Number(cust.total_spent) || 0) + total,
        orders_count: (Number(cust.orders_count) || 0) + 1,
        updated_at: new Date().toISOString(),
      };
      if (order.customer_name && (!cust.name || /^(valued patron|customer)$/i.test(cust.name))) patch.name = order.customer_name;
      if (!cust.email && order.email) patch.email = String(order.email).trim().toLowerCase();
      if (!phoneKey(cust.phone) && phoneKey(order.phone)) patch.phone = phoneKey(order.phone);
      await supabase.from("customers").update(patch).eq("id", cust.id);
    } else {
      await supabase.from("customers").insert({
        id: `cust-${Date.now().toString(36)}`, name: order.customer_name || "Customer", phone: phoneKey(order.phone) || order.phone,
        email: order.email || null, city: "Hyderabad", total_spent: total, orders_count: 1,
      });
    }
  } catch (e) {
    console.warn("[OnlineOrders] customer update notice:", e.message);
  }
}

/**
 * Marks the order paid exactly once (the status flip is the atomic claim), then deducts stock and
 * updates the customer. Safe to call from the webhook and verify endpoints concurrently.
 * `orderKey` = the order's reference ("ord-…") or invoice number.
 * `payment` = { paymentId, paymentMethod }.
 * Returns { found, finalized, already, orderNumber } — orderNumber is the invoice number.
 */
export function finalizePaidOrder(orderKey, payment = {}) {
  const method = payment.paymentMethod || "razorpay";
  const key = String(orderKey || "").trim();
  return withStockLock(async () => {
    let claimed = null;
    if (!ORDER_NUMBER_PATTERN.test(key)) return { found: false };
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .update({ payment_status: "paid", payment_method: method, updated_at: new Date().toISOString() })
        .or(`order_number.eq.${key},id.eq.${key}`)
        .in("payment_status", ["pending", "failed"])
        .select()
        .maybeSingle();
      if (error) throw error;
      claimed = data;
    } else {
      const o = findOrderFromStore(key);
      if (o && String(o.payment_status || o.paymentStatus).toLowerCase() !== "paid") {
        markOrderPaidInStore(key, { ...payment, paymentMethod: method });
        claimed = { ...o, order_number: o.order_number || o.orderNumber || key };
      }
    }

    if (!claimed) {
      const existing = await getOrder(key);
      if (!existing) return { found: false };
      // Paid earlier but its number could not be given then: give it now.
      const number = String(existing.payment_status).toLowerCase() === "paid"
        ? await assignInvoiceNumber(existing) : null;
      return { found: true, finalized: false, already: true, orderNumber: number || String(existing.order_number) };
    }

    // The order is paid: only now does it get its sequential invoice number.
    const assigned = await assignInvoiceNumber(claimed);
    const orderNumber = assigned || String(claimed.order_number);
    if (!assigned) {
      await recordPaymentAlert({
        type: "number_pending", orderKey: orderNumber,
        message: `Online order ${orderNumber} is paid but could not get its invoice number yet. It will be numbered on the next payment update; check Sales Receipts.`,
      });
    }

    // Keep the gateway payment id on the order (notes already holds "hold:<session>").
    if (supabase && payment.paymentId) {
      await supabase.from("orders")
        .update({ notes: `${claimed.notes || ""} payment:${payment.paymentId}`.trim() })
        .eq("id", claimed.id);
    }

    const sessionId = holdOf(claimed.notes);
    const items = Array.isArray(claimed.items) ? claimed.items : [];
    const short = await findStockShortages(items, { sessionId });
    if (short.length > 0) {
      // Money was taken but the pieces were sold elsewhere meanwhile: flag it for the admin.
      await recordPaymentAlert({
        type: "oversold", orderKey: orderNumber,
        message: `Order ${orderNumber} was paid but ${short.map((s) => s.name).join(", ")} is out of stock. Refund or source the saree.`,
      });
    }
    await deductStockForOrderItems(items, {
      referenceNumber: orderNumber,
      paymentMethod: method,
      performedBy: "Online Storefront (Razorpay)",
      notePrefix: "Online Order",
    });
    releaseHolds(sessionId);
    await upsertCustomer(claimed);
    invalidateCatalogCache();
    invalidateBootstrapCache();
    return { found: true, finalized: true, orderNumber };
  });
}

// A failed order is not an invoice. Orders created before invoice numbers were given at payment
// still hold a number while unpaid; moving them off it keeps it out of the receipts.
const voidedNumbers = (orderNumber) => {
  const v = `VOID-${orderNumber}-${Date.now().toString(36)}`;
  return { order_number: v, invoice_number: v };
};
async function voidUnpaidOrder(orderNumber) {
  await supabase.from("orders")
    .update({ payment_status: "failed", order_status: "cancelled", updated_at: new Date().toISOString(), ...voidedNumbers(orderNumber) })
    .eq("order_number", orderNumber).eq("payment_status", "pending");
}

/** A payment failed/was cancelled/expired: close the pending order, free the hold, tell the admin. */
export async function markOrderPaymentFailed(orderNumber, reason = "FAILED", amount) {
  let sid = null;
  if (supabase) {
    const { data } = await supabase
      .from("orders")
      .update({ payment_status: "failed", order_status: "cancelled", updated_at: new Date().toISOString(), ...voidedNumbers(orderNumber) })
      .eq("order_number", orderNumber)
      .eq("payment_status", "pending")
      .select("notes, total")
      .maybeSingle();
    if (!data) return false; // already paid or unknown: never downgrade a paid order
    sid = holdOf(data.notes);
    amount = amount ?? data.total;
  }
  releaseHolds(sid);
  await recordPaymentAlert({
    type: "payment_failed", orderKey: orderNumber,
    message: `Online payment for order ${orderNumber}${amount ? ` (₹${Number(amount).toLocaleString("en-IN")})` : ""} ${String(reason).toLowerCase()}. The customer has not been charged for an order.`,
  });
  invalidateBootstrapCache();
  return true;
}
