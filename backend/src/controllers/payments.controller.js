/**
 * Payments (Razorpay Standard Web Checkout).
 *
 *   Storefront:  checkout creates the order on the server ("ordered / payment pending", stock held)
 *                -> POST /payments/create-order   (Razorpay order for the order's STORED total)
 *                -> Razorpay modal in the browser
 *                -> POST /payments/verify-payment (signature + server-side payment check)
 *                -> order marked paid exactly once (finalizePaidOrder)
 *   Counter POS: POST /payments/create-payment-link -> customer pays on /pay -> verify / status
 *                poll / webhook records the sale exactly once (claimPendingSale).
 *   Webhook:     POST /payments/webhook finalises payments even if the customer's browser died.
 *
 * The browser's word is never trusted: amounts come from our order records, and an order is only
 * marked paid after Razorpay confirms a captured payment for exactly that amount.
 */
import * as Sentry from "@sentry/node";
import { supabase } from "../config/supabase.js";
import { ENV } from "../config/env.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { customerPaymentError } from "../utils/paymentErrors.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";
import { deductStockForOrderItems } from "../services/inventory.service.js";
import {
  claimWebhookEvent,
  releaseWebhookEvent,
  savePendingSale,
  claimPendingSale,
  unclaimPendingSale,
  recordPaymentAlert,
} from "../services/paymentStore.js";
import { finalizePaidOrder, getOrder, ORDER_NUMBER_PATTERN } from "../services/onlineOrders.js";
import {
  RAZORPAY_CURRENCY,
  MIN_AMOUNT_PAISE,
  toPaise,
  PaymentGatewayError,
  createRazorpayOrder,
  fetchRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  confirmOrderPayment,
} from "../services/razorpay.service.js";
import { getPaymentHistory, savePaymentAttempt, updatePaymentAttemptStatus } from "../database/localStore.js";

const RAZORPAY_ORDER_ID = /^order_[A-Za-z0-9]{6,40}$/;
const RAZORPAY_PAYMENT_ID = /^pay_[A-Za-z0-9]{6,40}$/;
const REUSE_WINDOW_MS = 25 * 60 * 1000;

// Per-key mutex so a double click / two tabs can never create two Razorpay orders for one order.
const inFlightLocks = new Map();

async function acquireLock(key, timeoutMs = 8000) {
  const start = Date.now();
  while (inFlightLocks.has(key)) {
    if (Date.now() - start > timeoutMs) {
      throw Object.assign(new Error("Another payment request for this order is in progress. Please wait."), { statusCode: 409 });
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  inFlightLocks.set(key, Date.now());
}

function releaseLock(key) {
  inFlightLocks.delete(key);
}

/** Sends a safe error to the client; the gateway's real reason goes to the logs/Sentry only. */
function sendPaymentError(res, err, context) {
  // Razorpay SDK errors are already PaymentGatewayError (see razorpay.service); anything else
  // (database, bug) is a plain 500 with a generic message.
  const gatewayErr = err instanceof PaymentGatewayError ? err : Object.assign(new Error(err?.message || "Unexpected error"), { statusCode: 500 });
  const status = Number(gatewayErr.statusCode) || 500;
  console.error(`[Razorpay] ${context}:`, gatewayErr.message);
  if (status === 401 || status >= 500) {
    try {
      Sentry.captureMessage(`Razorpay ${context}: ${gatewayErr.message}`, "error");
    } catch {}
    res.locals.errorReported = true;
  }
  const { message } = customerPaymentError(gatewayErr, gatewayErr.message);
  const clientMessage = status >= 500 && message === gatewayErr.message ? "Payment service error. Please try again." : message;
  return errorResponse(res, clientMessage, status);
}

const isPaidStatus = (o) => String(o?.payment_status ?? o?.paymentStatus ?? "").toLowerCase() === "paid";
const isPayableStatus = (o) => ["pending", "failed"].includes(String(o?.payment_status ?? o?.paymentStatus ?? "").toLowerCase());

/** Latest attempt for a key that is still usable (same amount, not paid, recent). */
function reusableAttempt(key, amountPaise) {
  const attempts = getPaymentHistory(key)?.attempts || [];
  const last = attempts[attempts.length - 1];
  if (!last?.gatewayOrderId || last.status !== "PENDING" || Number(last.amountPaise) !== amountPaise) return { last, reuse: null };
  const age = Date.now() - new Date(last.createdAt).getTime();
  return { last, reuse: age < REUSE_WINDOW_MS ? last : null };
}

// ---------------------------------------------------------------------------------------------
// Settlement (shared by verify, status polling and the webhook)
// ---------------------------------------------------------------------------------------------

/**
 * Persists a completed counter POS sale and deducts stock. The pending cart is claimed atomically,
 * so the admin polling, the customer's verify call and the webhook can never record it twice.
 */
async function autoRecordPosSale(razorpayOrderId, paymentId) {
  if (!supabase) return false;
  const pending = await claimPendingSale(razorpayOrderId);
  if (!pending || !Array.isArray(pending.items) || pending.items.length === 0) return false;

  try {
    const finalInvoiceNumber = pending.invoiceNumber;
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .or(`order_number.eq.${finalInvoiceNumber},invoice_number.eq.${finalInvoiceNumber}`)
      .limit(1)
      .maybeSingle();
    if (existing) return false; // already recorded (e.g. by the admin page): nothing to deduct

    const saleId = `pos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error: insertErr } = await supabase.from("orders").insert([{
      id: saleId,
      order_number: finalInvoiceNumber,
      invoice_number: finalInvoiceNumber,
      customer_name: pending.customerName || "Patron",
      phone: pending.customerPhone,
      email: pending.customerEmail,
      shipping_address: pending.customerAddress || "In-Store Showroom Counter",
      items: pending.items,
      subtotal: Number(pending.subtotal) || Number(pending.total) || 0,
      discount_amount: Number(pending.discount) || 0,
      total: Number(pending.total) || 0,
      payment_method: "razorpay",
      payment_status: "paid",
      order_status: "completed",
      billing_type: pending.billingType || "gst",
      notes: `Paid via Razorpay payment link (${paymentId})`,
    }]);
    if (insertErr) {
      if (insertErr.code === "23505") return false; // lost the race to another recorder: no double deduction
      throw insertErr;
    }

    await deductStockForOrderItems(pending.items, {
      referenceNumber: finalInvoiceNumber,
      paymentMethod: "razorpay",
      performedBy: "Razorpay Payment Link (POS)",
      notePrefix: `POS Sale Invoice`,
    });
    invalidateBootstrapCache();
    console.log(`[Razorpay POS] Recorded sale for invoice ${finalInvoiceNumber} (payment ${paymentId})`);
    return true;
  } catch (err) {
    console.warn(`[Razorpay POS] Auto-record failed for ${razorpayOrderId}:`, err.message);
    await unclaimPendingSale(razorpayOrderId).catch(() => {});
    await recordPaymentAlert({
      type: "record_failed", orderKey: razorpayOrderId,
      message: `A customer paid for ${pending.invoiceNumber} but the sale could not be recorded automatically (${err.message}). Check Transaction History.`,
    });
    return false;
  }
}

/**
 * A Razorpay order has a captured payment: apply it to OUR order exactly once.
 * The order is found through the notes we set when creating it (never through browser input),
 * and the amount must equal the order's stored total. Returns { settled, orderNumber?, mismatch? }.
 */
async function settlePaidRazorpayOrder(order, payment) {
  const notes = order?.notes || {};
  const paymentId = payment?.id;

  if (notes.kind === "pos") {
    await autoRecordPosSale(order.id, paymentId);
    updatePaymentAttemptStatus(order.id, "PAID", { paymentId });
    return { settled: true, invoiceNumber: notes.invoiceNumber };
  }

  const orderNumber = String(notes.orderNumber || "");
  if (notes.kind !== "online" || !ORDER_NUMBER_PATTERN.test(orderNumber)) {
    return { settled: false, unknown: true };
  }

  const ours = await getOrder(orderNumber);
  if (!ours) {
    await recordPaymentAlert({
      type: "paid_order_missing", orderKey: orderNumber,
      message: `Razorpay payment ${paymentId} (₹${(Number(order.amount) / 100).toLocaleString("en-IN")}) was received for order ${orderNumber}, but that order no longer exists as unpaid. Check it in Razorpay and contact the customer.`,
    });
    return { settled: false, orderNumber, missing: true };
  }
  if (toPaise(ours.total) !== Number(order.amount)) {
    await recordPaymentAlert({
      type: "amount_mismatch", orderKey: orderNumber,
      message: `Razorpay payment ${paymentId} for order ${orderNumber} was for ₹${(Number(order.amount) / 100).toLocaleString("en-IN")}, but the order total is ₹${Number(ours.total).toLocaleString("en-IN")}. The order was NOT marked paid.`,
    });
    return { settled: false, orderNumber, mismatch: true };
  }

  const result = await finalizePaidOrder(orderNumber, { paymentId, paymentMethod: "razorpay" });
  updatePaymentAttemptStatus(order.id, "PAID", { paymentId });
  return { settled: Boolean(result.found), orderNumber, already: Boolean(result.already) };
}

// ---------------------------------------------------------------------------------------------
// 1. CREATE ORDER   POST /api/payments/create-order   { orderNumber, amount? }
// ---------------------------------------------------------------------------------------------
export async function createOrder(req, res) {
  const orderNumber = String(req.body?.orderNumber || "").trim();
  if (!ORDER_NUMBER_PATTERN.test(orderNumber)) {
    return errorResponse(res, "A valid order number is required", 400);
  }
  const currency = String(req.body?.currency || RAZORPAY_CURRENCY).toUpperCase();
  if (currency !== RAZORPAY_CURRENCY) {
    return errorResponse(res, "Only INR payments are supported", 400);
  }
  if (!ENV.RAZORPAY.isConfigured) {
    return errorResponse(res, "Online payment is temporarily unavailable. Please try again shortly.", 503);
  }

  try {
    await acquireLock(orderNumber);
  } catch (err) {
    return errorResponse(res, err.message, 409);
  }

  try {
    const order = await getOrder(orderNumber);
    if (!order) return errorResponse(res, "Order not found. Please go back to checkout and try again.", 404);

    if (isPaidStatus(order)) {
      return successResponse(res, { paid: true, alreadyPaid: true, orderNumber }, "This order has already been paid.");
    }
    if (!isPayableStatus(order) || String(order.order_status || "").toLowerCase() === "cancelled") {
      return errorResponse(res, "This order can no longer be paid online. Please place a new order.", 409);
    }

    // The amount always comes from OUR stored order, never from the browser.
    const amountPaise = toPaise(order.total);
    if (amountPaise < MIN_AMOUNT_PAISE) {
      return errorResponse(res, "Order amount must be at least ₹1.", 400);
    }
    if (req.body?.amount !== undefined) {
      const claimed = toPaise(req.body.amount);
      if (!claimed) return errorResponse(res, "Invalid payment amount", 400);
      if (Math.abs(claimed - amountPaise) > 100) {
        return errorResponse(res, "Your cart total changed. Please review your order and try again.", 400);
      }
    }

    // Reuse a recent unpaid Razorpay order instead of creating a second one (double click, retry).
    const { last, reuse } = reusableAttempt(orderNumber, amountPaise);
    if (reuse) {
      try {
        const existing = await fetchRazorpayOrder(reuse.gatewayOrderId);
        if (existing.status === "paid") {
          const confirmed = await confirmOrderPayment(existing.id);
          if (confirmed.paid) {
            await settlePaidRazorpayOrder(confirmed.order, confirmed.payment);
            return successResponse(res, { paid: true, alreadyPaid: true, orderNumber }, "This order has already been paid.");
          }
        } else if (Number(existing.amount) === amountPaise) {
          return successResponse(res, {
            order_id: existing.id, amount: Number(existing.amount), currency: existing.currency,
            key_id: ENV.RAZORPAY.KEY_ID, orderNumber, reused: true,
          }, "Payment order ready");
        }
      } catch {
        // Could not re-read it: fall through and create a fresh Razorpay order.
      }
    }

    const attemptNumber = (Number(last?.attemptNumber) || (getPaymentHistory(orderNumber)?.attempts?.length ?? 0)) + 1;
    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      receipt: `${orderNumber}-A${attemptNumber}`,
      notes: { kind: "online", orderNumber, source: "RS_Fashions_WebStore" },
    });

    savePaymentAttempt(orderNumber, {
      attemptNumber,
      gatewayOrderId: rzpOrder.id,
      amountPaise,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });

    return successResponse(res, {
      order_id: rzpOrder.id,
      amount: Number(rzpOrder.amount),
      currency: rzpOrder.currency,
      key_id: ENV.RAZORPAY.KEY_ID,
      orderNumber,
      reused: false,
    }, "Payment order created");
  } catch (err) {
    return sendPaymentError(res, err, "create-order");
  } finally {
    releaseLock(orderNumber);
  }
}

// ---------------------------------------------------------------------------------------------
// 2. VERIFY PAYMENT   POST /api/payments/verify-payment
//    { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ---------------------------------------------------------------------------------------------
export async function verifyPayment(req, res) {
  const razorpayOrderId = String(req.body?.razorpay_order_id || "").trim();
  const razorpayPaymentId = String(req.body?.razorpay_payment_id || "").trim();
  const signature = String(req.body?.razorpay_signature || "").trim();

  if (!razorpayOrderId || !razorpayPaymentId || !signature) {
    return errorResponse(res, "razorpay_order_id, razorpay_payment_id and razorpay_signature are required", 400);
  }
  if (!RAZORPAY_ORDER_ID.test(razorpayOrderId) || !RAZORPAY_PAYMENT_ID.test(razorpayPaymentId)) {
    return errorResponse(res, "Invalid payment reference", 400);
  }
  if (!ENV.RAZORPAY.isConfigured) {
    return errorResponse(res, "Online payment is temporarily unavailable. Please try again shortly.", 503);
  }
  // Nothing is changed unless the signature proves Razorpay issued this payment for this order.
  if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature)) {
    console.warn(`[Razorpay] Signature mismatch for ${razorpayOrderId}`);
    return errorResponse(res, "Payment verification failed", 400);
  }

  try {
    const confirmed = await confirmOrderPayment(razorpayOrderId, { preferPaymentId: razorpayPaymentId });
    if (!confirmed.paid) {
      // Signature is genuine but Razorpay has not captured the money yet: not paid (yet).
      return res.status(202).json({
        success: false, paid: false, pending: true,
        message: "Your payment is being confirmed by the bank. Please don't pay again; we will update your order shortly.",
      });
    }

    const result = await settlePaidRazorpayOrder(confirmed.order, confirmed.payment);
    if (result.mismatch) return errorResponse(res, "Payment amount does not match this order. Our team has been notified.", 400);
    if (result.unknown) return errorResponse(res, "Payment does not belong to a known order", 400);
    if (result.missing) return errorResponse(res, "We received your payment but could not find the order. Our team has been notified and will contact you.", 409);

    return successResponse(res, {
      verified: true,
      paid: true,
      orderNumber: result.orderNumber,
      invoiceNumber: result.invoiceNumber,
      paymentId: confirmed.payment.id,
      alreadyProcessed: Boolean(result.already),
    }, "Payment verified");
  } catch (err) {
    return sendPaymentError(res, err, "verify-payment");
  }
}

// ---------------------------------------------------------------------------------------------
// 3. PAYMENT STATUS   GET /api/payments/status/:razorpayOrderId
//    Server-side check used by the counter page polling, /pay and network-recovery. Idempotent.
// ---------------------------------------------------------------------------------------------
export async function getPaymentStatus(req, res) {
  // Live payment state: never let a browser, CDN or proxy cache it.
  res.set("Cache-Control", "no-store");
  const razorpayOrderId = String(req.params?.razorpayOrderId || "").trim();
  if (!RAZORPAY_ORDER_ID.test(razorpayOrderId)) {
    return errorResponse(res, "A valid payment reference is required", 400);
  }
  if (!ENV.RAZORPAY.isConfigured) {
    return errorResponse(res, "Online payment is temporarily unavailable.", 503);
  }
  try {
    const confirmed = await confirmOrderPayment(razorpayOrderId);
    if (confirmed.paid) {
      const result = await settlePaidRazorpayOrder(confirmed.order, confirmed.payment);
      return successResponse(res, {
        paid: !result.mismatch && !result.unknown,
        orderStatus: "PAID",
        paymentId: confirmed.payment.id,
        orderNumber: result.orderNumber,
        invoiceNumber: result.invoiceNumber,
      });
    }
    return successResponse(res, {
      paid: false,
      orderStatus: String(confirmed.order?.status || "created").toUpperCase(),
      lastPaymentStatus: confirmed.payment?.status || null,
      // Public details so the /pay page can show the real amount and open the checkout.
      amount: Number(confirmed.order?.amount) || undefined,
      currency: confirmed.order?.currency,
      key_id: ENV.RAZORPAY.KEY_ID,
    });
  } catch (err) {
    return sendPaymentError(res, err, "status");
  }
}

function getPublicClientUrl(req) {
  const origin = req?.headers?.origin || req?.headers?.referer;
  if (origin && typeof origin === "string" && origin.startsWith("https://")) {
    try {
      const u = new URL(origin);
      if (u.hostname === "www.rsfashions25.com" || u.hostname === "rsfashions25.com") {
        return "https://www.rsfashions25.com";
      }
      return u.origin;
    } catch {}
  }
  const envUrl = String(ENV.CLIENT_URL || "").trim();
  if (envUrl.startsWith("https://") && !envUrl.includes("vercel.app")) {
    return envUrl;
  }
  return "https://www.rsfashions25.com";
}

// ---------------------------------------------------------------------------------------------
// 4. COUNTER (POS) PAYMENT LINK   POST /api/payments/create-payment-link
//    Creates a Razorpay order for the counter bill and returns a link to our /pay page.
// ---------------------------------------------------------------------------------------------
export async function createPaymentLink(req, res) {
  const {
    amount,
    customerName = "Valued Customer",
    customerPhone = "",
    customerEmail = "",
    invoiceNumber = `RSF-POS-${Date.now().toString().slice(-6)}`,
    items = [],
    subtotal = 0,
    discount = 0,
    billingType = "gst",
    customerAddress,
  } = req.body || {};

  const amountPaise = toPaise(amount);
  if (!amountPaise) return errorResponse(res, "Valid payment amount is required", 400);
  if (amountPaise < MIN_AMOUNT_PAISE) return errorResponse(res, "Payment amount must be at least ₹1.", 400);
  const amountInRupees = amountPaise / 100;

  const cleanPhone = String(customerPhone).replace(/[^0-9]/g, "").slice(-10);
  if (cleanPhone.length !== 10) {
    return errorResponse(res, "Valid 10-digit customer phone number is required", 400);
  }
  if (!ENV.RAZORPAY.isConfigured) {
    return errorResponse(res, "Online payment is temporarily unavailable. Please try again shortly.", 503);
  }

  const posKey = `POS_${String(invoiceNumber).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  try {
    await acquireLock(posKey);
  } catch (err) {
    return errorResponse(res, err.message, 409);
  }

  try {
    const { last, reuse } = reusableAttempt(posKey, amountPaise);
    if (last?.status === "PAID") {
      return successResponse(res, { orderId: last.gatewayOrderId, status: "PAID", paid: true, amount: amountInRupees, invoiceNumber }, "Invoice is already paid.");
    }
    if (reuse?.paymentLinkUrl) {
      return successResponse(res, {
        paymentLink: reuse.paymentLinkUrl, linkUrl: reuse.paymentLinkUrl,
        paymentLinkId: reuse.gatewayOrderId, orderId: reuse.gatewayOrderId,
        amount: amountInRupees, invoiceNumber, status: "ACTIVE", reused: true,
      }, "Existing active payment link reused.");
    }

    const attemptNumber = (Number(last?.attemptNumber) || 0) + 1;
    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      receipt: `${posKey}-A${attemptNumber}`,
      notes: { kind: "pos", invoiceNumber: String(invoiceNumber), source: "RS_Fashions_Showroom_POS" },
    });

    const publicClientUrl = getPublicClientUrl(req);
    const paymentLinkUrl = `${publicClientUrl}/pay?order_id=${rzpOrder.id}&amount=${amountInRupees}&invoice=${encodeURIComponent(invoiceNumber)}&customer=${encodeURIComponent(String(customerName).trim())}`;

    savePaymentAttempt(posKey, {
      attemptNumber,
      gatewayOrderId: rzpOrder.id,
      paymentLinkUrl,
      amountPaise,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });

    await savePendingSale(rzpOrder.id, {
      orderId: rzpOrder.id,
      invoiceNumber,
      customerName: String(customerName).trim(),
      customerPhone: cleanPhone,
      customerEmail: String(customerEmail || "").trim() || null,
      customerAddress: customerAddress || req.body?.address || "In-Store Showroom Counter",
      items,
      subtotal: Number(subtotal) || amountInRupees,
      discount: Number(discount) || 0,
      total: amountInRupees,
      billingType,
      committed: false,
    }, posKey);

    return successResponse(res, {
      paymentLink: paymentLinkUrl,
      linkUrl: paymentLinkUrl,
      paymentLinkId: rzpOrder.id,
      orderId: rzpOrder.id,
      amount: amountInRupees,
      invoiceNumber,
      status: "ACTIVE",
      reused: false,
    }, "Payment link generated");
  } catch (err) {
    return sendPaymentError(res, err, "create-payment-link");
  } finally {
    releaseLock(posKey);
  }
}

// ---------------------------------------------------------------------------------------------
// 5. WEBHOOK   POST /api/payments/webhook   (X-Razorpay-Signature over the raw body)
//    Confirms payments when nobody is on a page (browser closed after paying). Each event is
//    claimed atomically, and settlement is idempotent, so retries never pay an order twice.
// ---------------------------------------------------------------------------------------------
const SETTLE_EVENTS = new Set(["payment.captured", "payment.authorized", "order.paid"]);

export async function handleWebhook(req, res) {
  if (!ENV.RAZORPAY.WEBHOOK_SECRET || !ENV.RAZORPAY.isConfigured) {
    console.warn("[Razorpay Webhook] Received, but RAZORPAY_WEBHOOK_SECRET / keys are not configured.");
    return errorResponse(res, "Webhook not configured", 503);
  }
  const signature = req.headers["x-razorpay-signature"];
  if (!verifyWebhookSignature(req.rawBody || req.body, signature)) {
    console.warn("[Razorpay Webhook] Invalid signature.");
    return errorResponse(res, "Invalid webhook signature", 400);
  }

  const event = req.body || {};
  const eventType = String(event.event || "");
  const payment = event.payload?.payment?.entity || null;
  const razorpayOrderId = payment?.order_id || event.payload?.order?.entity?.id || null;
  const eventId = `rzp:${req.headers["x-razorpay-event-id"] || `${eventType}:${payment?.id || razorpayOrderId}`}`;

  let claimed = false;
  try {
    claimed = await claimWebhookEvent(eventId, { eventType, razorpayOrderId, paymentId: payment?.id || null });
    if (!claimed) {
      return successResponse(res, { received: true, deduplicated: true }, "Already processed");
    }

    if (razorpayOrderId && SETTLE_EVENTS.has(eventType)) {
      // Re-read from Razorpay rather than trusting the payload's status/amount.
      const confirmed = await confirmOrderPayment(razorpayOrderId, { preferPaymentId: payment?.id });
      if (confirmed.paid) {
        const result = await settlePaidRazorpayOrder(confirmed.order, confirmed.payment);
        console.log(`[Razorpay Webhook] ${eventType} for ${razorpayOrderId}: ${JSON.stringify({ ...result })}`);
      }
    } else if (eventType === "payment.failed" && razorpayOrderId) {
      // A failed attempt does not end the order: the customer can retry in the same window.
      // Unpaid orders are closed by the 2-hour cleanup, and the stock hold expires by itself.
      updatePaymentAttemptStatus(razorpayOrderId, "PENDING");
      console.log(`[Razorpay Webhook] payment.failed for ${razorpayOrderId} (${payment?.error_reason || "no reason"})`);
    }

    return successResponse(res, { received: true, processed: true }, "Webhook processed");
  } catch (err) {
    console.error("[Razorpay Webhook] Processing error:", err?.message || err);
    // Let Razorpay retry this event.
    if (claimed) await releaseWebhookEvent(eventId).catch(() => {});
    return errorResponse(res, "Webhook processing error", 500);
  }
}
