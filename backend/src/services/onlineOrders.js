/**
 * Storefront (online) orders are created on the SERVER before the customer pays, as
 * "ordered / payment pending", and are finalised (marked paid, stock deducted, customer updated)
 * by whichever confirmation arrives first: the Cashfree webhook, the browser's verify call, or
 * the admin polling. This means a paid order exists even if the customer's browser died after
 * paying, and it appears in "My Orders" and the admin panel without anyone being on a page.
 */
import { supabase } from "../config/supabase.js";
import { saveOrderToStore, findOrderFromStore, markOrderPaidInStore } from "../database/localStore.js";
import {
  deductStockForOrderItems,
  findStockShortages,
  holdStock,
  releaseHolds,
  withStockLock,
} from "./inventory.service.js";
import { peekNextOrderNumber, withOrderNumberLock } from "./orderNumber.js";
import { recordPaymentAlert } from "./paymentStore.js";
import { invalidateCatalogCache } from "../controllers/catalog.controller.js";
import { invalidateBootstrapCache } from "../controllers/bootstrap.controller.js";

const ONLINE_HOLD_MS = 30 * 60 * 1000; // Cashfree sessions live ~30 min
const STALE_PENDING_MS = 2 * 60 * 60 * 1000;
export const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9_-]{3,60}$/;

const holdOf = (notes) => /hold:([\w-]+)/.exec(String(notes || ""))?.[1] || null;

/** "RSF_<orderNumber>_A2" -> "<orderNumber>" (null for counter POS links). */
export function orderNumberFromCfOrderId(cfOrderId) {
  const m = /^RSF_(.+)_A\d+$/.exec(String(cfOrderId || ""));
  if (!m || m[1].startsWith("POS_")) return null;
  return ORDER_NUMBER_PATTERN.test(m[1]) ? m[1] : null;
}

async function getOrder(orderNumber) {
  if (supabase) {
    const { data } = await supabase.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
    return data || null;
  }
  const o = findOrderFromStore(orderNumber);
  return o ? { ...o, order_number: orderNumber, payment_status: o.payment_status || o.paymentStatus } : null;
}

/** POST /billing/pending-order — called by checkout right before the Cashfree payment opens. */
export async function createPendingOrder(body = {}) {
  const clientKey = String(body.orderNumber || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];
  const phone = body.customerPhone || body.phone;
  if (!ORDER_NUMBER_PATTERN.test(clientKey)) return { status: 400, body: { success: false, message: "A valid order number is required" } };
  if (!phone || items.length === 0) return { status: 400, body: { success: false, message: "Customer phone and at least one item are required" } };

  // A number the server already issued (001, 002…) is a retry of the same order. Anything else is
  // a temporary client key: the server assigns the next sequential number when saving the order.
  const isIssued = /^\d{3,}$/.test(clientKey);
  let orderNumber = clientKey;
  const existing = isIssued ? await getOrder(orderNumber) : null;
  if (existing && String(existing.payment_status).toLowerCase() === "paid") {
    return { status: 200, body: { success: true, alreadyPaid: true, orderNumber } };
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
    shipping_address: body.shipping_address || body.address || null,
    items,
    subtotal: Number(body.subtotal) || 0,
    cgst: 0,
    sgst: 0,
    shipping_fee: Number(body.shippingFee ?? body.shipping_fee) || 0,
    discount_amount: Number(body.discount ?? body.discount_amount) || 0,
    coupon_code: body.couponCode || null,
    total: Number(body.total) || 0,
    payment_method: "cashfree",
    payment_status: "pending",
    order_status: "ordered",
    billing_type: "gst",
    notes: `hold:${sessionId}`,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    if (existing) {
      const { error } = await supabase.from("orders").update(row).eq("order_number", orderNumber);
      if (error) throw error;
    } else {
      await withOrderNumberLock(async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          orderNumber = await peekNextOrderNumber();
          const { error } = await supabase.from("orders").insert({
            id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            ...row, order_number: orderNumber, invoice_number: orderNumber,
          });
          if (!error) return;
          if (error.code !== "23505") throw error;
        }
        throw new Error("Could not allocate an order number");
      });
    }
    // Housekeeping: online orders never paid within 2 hours are closed.
    const cutoff = new Date(Date.now() - STALE_PENDING_MS).toISOString();
    await supabase.from("orders").update({ payment_status: "failed", order_status: "cancelled" })
      .eq("payment_status", "pending").eq("payment_method", "cashfree").lt("updated_at", cutoff);
  } else if (existing) {
    saveOrderToStore({ id: existing.id || `ord-${Date.now().toString(36)}`, ...row, paymentStatus: "pending", orderStatus: "ordered", orderNumber, invoiceNumber: orderNumber });
  } else {
    await withOrderNumberLock(async () => {
      orderNumber = await peekNextOrderNumber();
      saveOrderToStore({ id: `ord-${Date.now().toString(36)}`, ...row, order_number: orderNumber, invoice_number: orderNumber, paymentStatus: "pending", orderStatus: "ordered", orderNumber, invoiceNumber: orderNumber });
    });
  }
  invalidateBootstrapCache();
  return { status: 201, body: { success: true, orderNumber, holdMinutes: 30 } };
}

async function upsertCustomer(order) {
  if (!supabase || !order.phone) return;
  try {
    const { data: cust } = await supabase.from("customers").select("*").eq("phone", order.phone).maybeSingle();
    const total = Number(order.total) || 0;
    if (cust) {
      await supabase.from("customers").update({
        name: order.customer_name || cust.name,
        total_spent: (Number(cust.total_spent) || 0) + total,
        orders_count: (Number(cust.orders_count) || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq("phone", order.phone);
    } else {
      await supabase.from("customers").insert({
        id: `cust-${Date.now().toString(36)}`, name: order.customer_name || "Customer", phone: order.phone,
        email: order.email || null, city: "Hyderabad", total_spent: total, orders_count: 1,
      });
    }
  } catch (e) {
    console.warn("[OnlineOrders] customer update notice:", e.message);
  }
}

/**
 * Marks the order paid exactly once (the status flip is the atomic claim), then deducts stock and
 * updates the customer. Safe to call from the webhook, verify and finalize endpoints concurrently.
 * Returns { found, finalized, already }.
 */
export function finalizePaidOrder(orderNumber, payment = {}) {
  return withStockLock(async () => {
    let claimed = null;
    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .update({ payment_status: "paid", payment_method: "cashfree", updated_at: new Date().toISOString() })
        .eq("order_number", orderNumber)
        .in("payment_status", ["pending", "failed"])
        .select()
        .maybeSingle();
      if (error) throw error;
      claimed = data;
    } else {
      const o = findOrderFromStore(orderNumber);
      if (o && String(o.payment_status || o.paymentStatus).toLowerCase() !== "paid") {
        markOrderPaidInStore(orderNumber, payment);
        claimed = { ...o, order_number: orderNumber };
      }
    }

    if (!claimed) {
      const existing = await getOrder(orderNumber);
      return existing ? { found: true, finalized: false, already: true } : { found: false };
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
      paymentMethod: "cashfree",
      performedBy: "Online Storefront (Cashfree)",
      notePrefix: "Online Order",
    });
    releaseHolds(sessionId);
    await upsertCustomer(claimed);
    invalidateCatalogCache();
    invalidateBootstrapCache();
    return { found: true, finalized: true };
  });
}

/** A payment failed/was cancelled/expired: close the pending order, free the hold, tell the admin. */
export async function markOrderPaymentFailed(orderNumber, reason = "FAILED", amount) {
  let sid = null;
  if (supabase) {
    const { data } = await supabase
      .from("orders")
      .update({ payment_status: "failed", order_status: "cancelled", updated_at: new Date().toISOString() })
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
