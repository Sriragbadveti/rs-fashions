import {
  createCashfreeOrder as createCFOrderService,
  getCashfreeOrder,
  getCashfreeOrderPayments,
  verifyCashfreeWebhookSignature,
} from "../services/cashfree.service.js";
import { supabase } from "../config/supabase.js";
import { ENV } from "../config/env.js";
import * as Sentry from "@sentry/node";
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
import { finalizePaidOrder, markOrderPaymentFailed, orderNumberFromCfOrderId } from "../services/onlineOrders.js";
import {
  getPaymentHistory,
  savePaymentAttempt,
  updatePaymentAttemptStatus,
  findOrderFromStore,
  markOrderPaidInStore,
  isWebhookEventProcessed,
  recordWebhookEvent,
} from "../database/localStore.js";

function safeErrorMsg(err) {
  if (!err) return "Payment operation failed";
  let msg = typeof err === "string" ? err : err.message || "Payment operation failed";
  if (ENV.CASHFREE.SECRET_KEY) {
    msg = msg.split(ENV.CASHFREE.SECRET_KEY).join("[REDACTED]");
  }
  if (ENV.CASHFREE.APP_ID) {
    msg = msg.split(ENV.CASHFREE.APP_ID).join("[REDACTED]");
  }
  msg = msg.replace(/Headers\.append:.*is an invalid header value/gi, "Payment gateway configuration error");
  return msg;
}

// Concurrency mutex lock to prevent simultaneous requests from creating duplicate Cashfree orders
const inFlightLocks = new Map();

async function acquireLock(key, timeoutMs = 8000) {
  const start = Date.now();
  while (inFlightLocks.has(key)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Payment request concurrency timeout. Another request is currently processing.");
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  inFlightLocks.set(key, Date.now());
}

function releaseLock(key) {
  inFlightLocks.delete(key);
}

/**
 * 1. CREATE CASHFREE PAYMENT ORDER (With Concurrency Control & Idempotency)
 * POST /api/payments/cashfree/create-order
 */
export async function createCashfreeOrder(req, res) {
  const {
    amount,
    currency = "INR",
    customerName = "Valued Customer",
    customerPhone: rawCustomerPhone,
    customerEmail: rawCustomerEmail,
    phone: aliasPhone,
    email: aliasEmail,
    customerId,
    orderNumber,
    idempotencyKey,
    orderNote = "RS Fashions Saree Order",
    returnUrl,
  } = req.body;

  // The storefront sends the customer's details as `phone` / `email`; accept both spellings.
  const customerPhone = rawCustomerPhone || aliasPhone || "";
  const customerEmail = rawCustomerEmail || aliasEmail || "customer@rsfashions.in";

  const amountInRupees = Number(amount) || 0;
  if (amountInRupees <= 0) {
    return errorResponse(res, "Valid payment amount is required", 400);
  }

  const cleanPhone = String(customerPhone).replace(/[^0-9]/g, "").slice(-10);
  if (!cleanPhone || cleanPhone.length < 10) {
    return errorResponse(res, "Valid 10-digit customer phone number is required", 400);
  }

  // Derive stable order key: orderNumber takes precedence, fallback to idempotencyKey or phone+amount
  const orderKey = orderNumber
    ? String(orderNumber).trim()
    : idempotencyKey
    ? String(idempotencyKey).trim()
    : `cart_${cleanPhone}_${amountInRupees}`;

  const cleanOrderSlug = orderKey.replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    await acquireLock(orderKey);

    // 1. Check if the internal order exists in DB / store
    let internalOrder = findOrderFromStore(orderKey);
    if (!internalOrder && supabase) {
      try {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .or(`order_number.eq.${orderKey},id.eq.${orderKey}`)
          .maybeSingle();
        if (data) internalOrder = data;
      } catch {}
    }

    // Server-side amount validation if order exists in DB
    if (internalOrder && internalOrder.total) {
      const recordedTotal = Number(internalOrder.total);
      if (recordedTotal > 0 && Math.abs(recordedTotal - amountInRupees) > 1) {
        return errorResponse(
          res,
          `Payment amount mismatch. Order requires ₹${recordedTotal}, but received ₹${amountInRupees}.`,
          400
        );
      }
    }

    // 2. State Machine Check: If order is already PAID, return paid state immediately (NO NEW CHARGE)
    const isOrderAlreadyPaid =
      internalOrder &&
      (String(internalOrder.payment_status || internalOrder.paymentStatus).toLowerCase() === "paid" ||
        String(internalOrder.order_status || internalOrder.orderStatus).toLowerCase() === "delivered");

    if (isOrderAlreadyPaid) {
      return successResponse(
        res,
        {
          orderId: internalOrder.order_number || internalOrder.orderNumber || orderKey,
          orderStatus: "PAID",
          paid: true,
          orderAmount: Number(internalOrder.total) || amountInRupees,
          orderCurrency: currency,
          alreadyPaid: true,
        },
        "Order has already been paid successfully. No additional payment required."
      );
    }

    // 3. Check Payment History for existing active / pending sessions
    const history = getPaymentHistory(orderKey);
    let attemptNumber = 1;

    if (history && Array.isArray(history.attempts) && history.attempts.length > 0) {
      const lastAttempt = history.attempts[history.attempts.length - 1];

      // If last attempt is already PAID
      if (lastAttempt.status === "PAID") {
        return successResponse(
          res,
          {
            orderId: lastAttempt.cfOrderId,
            orderStatus: "PAID",
            paid: true,
            orderAmount: lastAttempt.orderAmount,
            orderCurrency: lastAttempt.orderCurrency || currency,
            alreadyPaid: true,
          },
          "Order has already been paid successfully."
        );
      }

      // If last attempt is PENDING, verify status and reuse session if active
      if (lastAttempt.status === "PENDING" && lastAttempt.paymentSessionId) {
        const ageMinutes = (Date.now() - new Date(lastAttempt.createdAt).getTime()) / (60 * 1000);

        // If session was created recently (< 25 mins, Cashfree default expiry is 30 mins)
        if (ageMinutes < 25) {
          try {
            const cfOrderData = await getCashfreeOrder(lastAttempt.cfOrderId);
            if (cfOrderData.order_status === "PAID") {
              updatePaymentAttemptStatus(lastAttempt.cfOrderId, "PAID");
              markOrderPaidInStore(orderKey, { cfOrderId: lastAttempt.cfOrderId });
              return successResponse(
                res,
                {
                  orderId: lastAttempt.cfOrderId,
                  orderStatus: "PAID",
                  paid: true,
                  orderAmount: lastAttempt.orderAmount,
                  orderCurrency: currency,
                  alreadyPaid: true,
                },
                "Payment for this order was already completed."
              );
            }

            if (cfOrderData.order_status === "ACTIVE") {
              // REUSE existing valid payment session to prevent double payment!
              return successResponse(
                res,
                {
                  orderId: lastAttempt.cfOrderId,
                  paymentSessionId: lastAttempt.paymentSessionId,
                  orderAmount: lastAttempt.orderAmount,
                  orderCurrency: lastAttempt.orderCurrency || currency,
                  orderStatus: "ACTIVE",
                  reused: true,
                  attemptNumber: lastAttempt.attemptNumber,
                },
                "Active Cashfree payment session reused successfully"
              );
            }

            if (cfOrderData.order_status === "EXPIRED" || cfOrderData.order_status === "TERMINATED") {
              updatePaymentAttemptStatus(lastAttempt.cfOrderId, "EXPIRED");
            }
          } catch {
            // If Cashfree call fails but session is very fresh (< 10 mins), safely reuse
            if (ageMinutes < 10) {
              return successResponse(
                res,
                {
                  orderId: lastAttempt.cfOrderId,
                  paymentSessionId: lastAttempt.paymentSessionId,
                  orderAmount: lastAttempt.orderAmount,
                  orderCurrency: lastAttempt.orderCurrency || currency,
                  orderStatus: "ACTIVE",
                  reused: true,
                  attemptNumber: lastAttempt.attemptNumber,
                },
                "Active Cashfree payment session reused"
              );
            }
          }
        }
      }

      // If previous attempt is FAILED, EXPIRED, or CANCELLED, increment attempt counter
      attemptNumber = (lastAttempt.attemptNumber || history.attempts.length) + 1;
    }

    // 4. Generate deterministic Cashfree Order ID linked to this internal order attempt
    const cfOrderId = `RSF_${cleanOrderSlug}_A${attemptNumber}`;

    const isBenchmarkMock =
      req.headers["x-benchmark-mock"] === "true" || process.env.CASHFREE_MOCK_BENCHMARK === "true";

    const cfOrder = await createCFOrderService({
      orderId: cfOrderId,
      orderAmount: amountInRupees,
      orderCurrency: currency,
      customerDetails: {
        customerId: customerId || `cust_${cleanPhone}`,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: cleanPhone,
      },
      orderMeta: {
        returnUrl: returnUrl || `${ENV.CLIENT_URL}/checkout?order_id=${cfOrderId}&status=cashfree_return`,
        notifyUrl: `${ENV.BACKEND_URL}/api/payments/cashfree/webhook`,
      },
      orderNote,
      orderTags: {
        source: "RS_Fashions_WebStore",
        orderNumber: orderKey,
        attemptNumber: String(attemptNumber),
      },
      isMock: isBenchmarkMock,
    });

    const paymentSessionId = cfOrder.payment_session_id;

    // 5. Record payment attempt in local database / history
    savePaymentAttempt(orderKey, {
      attemptNumber,
      cfOrderId,
      paymentSessionId,
      orderAmount: amountInRupees,
      orderCurrency: currency,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    });

    return successResponse(
      res,
      {
        orderId: cfOrder.order_id || cfOrderId,
        paymentSessionId,
        orderAmount: cfOrder.order_amount || amountInRupees,
        orderCurrency: cfOrder.order_currency || currency,
        orderStatus: cfOrder.order_status || "ACTIVE",
        environment: cfOrder.environment || ENV.CASHFREE.ENV,
        attemptNumber,
        reused: false,
      },
      "Cashfree payment order created successfully"
    );
  } catch (err) {
    const gatewayMsg = safeErrorMsg(err);
    console.error("[Cashfree Controller] Create Order Error:", gatewayMsg);
    const { message, statusCode } = customerPaymentError(err, gatewayMsg);
    if (message !== gatewayMsg) {
      // The customer gets a friendly message; Sentry still gets the gateway's real reason.
      try {
        Sentry.captureMessage(`Cashfree create-order rejected: ${gatewayMsg}`, "error");
      } catch {}
      res.locals.errorReported = true;
    }
    return errorResponse(res, message, statusCode);
  } finally {
    releaseLock(orderKey);
  }
}

/**
 * 2. VERIFY CASHFREE PAYMENT STATUS (Server-Side Source of Truth)
 * POST /api/payments/cashfree/verify
 */
export async function verifyCashfreePayment(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return errorResponse(res, "Missing orderId for Cashfree verification", 400);
    }

    // 1. Fetch Order & Payments directly from Cashfree API
    const orderData = await getCashfreeOrder(orderId);
    const payments = await getCashfreeOrderPayments(orderId);

    const isPaid =
      orderData.order_status === "PAID" ||
      payments.some((p) => String(p.payment_status).toUpperCase() === "SUCCESS");

    const successfulPayment =
      payments.find((p) => String(p.payment_status).toUpperCase() === "SUCCESS") ||
      payments[0] ||
      {};

    const paymentId = successfulPayment.payment_id || `cf_pay_${Date.now()}`;
    const paymentMethod = successfulPayment.payment_group || "cashfree";

    if (isPaid) {
      // Counter (POS) link: record the sale if the webhook/another poll hasn't already.
      await autoRecordPosSale(orderId, paymentId, successfulPayment);
      // Storefront order: mark paid, deduct stock, update customer (idempotent).
      await finalizeOnlineOrderFor(orderId, orderData.order_tags, { paymentId, paymentMethod, paymentDetails: successfulPayment });

      updatePaymentAttemptStatus(orderId, "PAID", { paymentId, paymentDetails: successfulPayment });
      markOrderPaidInStore(orderId, { paymentId, paymentMethod, paymentDetails: successfulPayment });
    } else if (orderData.order_status === "EXPIRED" || orderData.order_status === "TERMINATED") {
      updatePaymentAttemptStatus(orderId, "EXPIRED");
      await handleFailedPayment(orderId, orderData.order_tags, "expired");
    } else if (orderData.order_status === "FAILED") {
      updatePaymentAttemptStatus(orderId, "FAILED");
      await handleFailedPayment(orderId, orderData.order_tags, "failed");
    }

    return successResponse(
      res,
      {
        verified: isPaid,
        paid: isPaid,
        orderId,
        paymentId,
        orderStatus: orderData.order_status || (isPaid ? "PAID" : "ACTIVE"),
        paymentDetails: successfulPayment,
      },
      isPaid ? "Cashfree payment verified successfully" : "Payment not completed or pending"
    );
  } catch (err) {
    console.error("[Cashfree Controller] Verify Payment Error:", safeErrorMsg(err));
    return errorResponse(res, safeErrorMsg(err), 500);
  }
}

/**
 * 3. GET PAYMENT STATUS FOR AN ORDER (For Network Recovery & Safe Retries)
 * GET /api/payments/cashfree/status/:orderId
 */
export async function getPaymentStatus(req, res) {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return errorResponse(res, "Order ID is required", 400);
    }

    const history = getPaymentHistory(orderId);
    let internalOrder = findOrderFromStore(orderId);

    if (internalOrder && String(internalOrder.payment_status).toLowerCase() === "paid") {
      return successResponse(res, {
        orderId,
        orderStatus: "PAID",
        paid: true,
      });
    }

    if (history && history.attempts.length > 0) {
      const lastAttempt = history.attempts[history.attempts.length - 1];
      if (lastAttempt.status === "PAID") {
        return successResponse(res, {
          orderId: lastAttempt.cfOrderId,
          orderStatus: "PAID",
          paid: true,
        });
      }

      // Check with Cashfree
      try {
        const cfOrder = await getCashfreeOrder(lastAttempt.cfOrderId);
        return successResponse(res, {
          orderId: lastAttempt.cfOrderId,
          orderStatus: cfOrder.order_status || lastAttempt.status,
          paid: cfOrder.order_status === "PAID",
          paymentSessionId: cfOrder.order_status === "ACTIVE" ? lastAttempt.paymentSessionId : null,
          canRetry: cfOrder.order_status === "EXPIRED" || cfOrder.order_status === "FAILED",
        });
      } catch {
        return successResponse(res, {
          orderId: lastAttempt.cfOrderId,
          orderStatus: lastAttempt.status,
          paid: false,
          paymentSessionId: lastAttempt.paymentSessionId,
        });
      }
    }

    return successResponse(res, {
      orderId,
      orderStatus: "NOT_FOUND",
      paid: false,
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
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

/**
 * Persists a completed Counter POS sale into the orders table and deducts stock when Cashfree
 * confirms payment. The pending cart is stored in the database (pending_sales) so this works even
 * after a server restart, and it is CLAIMED atomically so the admin page polling and the webhook
 * can never both record (and both deduct) the same sale.
 */
async function autoRecordPosSale(orderId, paymentId) {
  if (!supabase) return false;
  const pending = await claimPendingSale(orderId);
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
      payment_method: "cashfree",
      payment_status: "paid",
      order_status: "completed",
      billing_type: pending.billingType || "gst",
      notes: `Paid via Cashfree Payment Link (${paymentId})`,
    }]);
    if (insertErr) {
      if (insertErr.code === "23505") return false; // lost the race to another recorder: no double deduction
      throw insertErr;
    }

    await deductStockForOrderItems(pending.items, {
      referenceNumber: finalInvoiceNumber,
      paymentMethod: "cashfree",
      performedBy: "Cashfree Payment Link (POS)",
      notePrefix: `POS Sale Invoice`,
    });
    invalidateBootstrapCache();
    console.log(`[Cashfree POS] Auto-recorded sale for invoice ${finalInvoiceNumber} (Ref: ${paymentId})`);
    return true;
  } catch (err) {
    console.warn(`[Cashfree POS] Auto-record failed for order ${orderId}:`, err.message);
    await unclaimPendingSale(orderId).catch(() => {});
    await recordPaymentAlert({
      type: "record_failed", orderKey: orderId,
      message: `A customer paid for ${pending.invoiceNumber} but the sale could not be recorded automatically (${err.message}). Check Transaction History.`,
    });
    return false;
  }
}

/** Marks a storefront order paid (idempotent). Used by webhook, verify and finalize. */
async function finalizeOnlineOrderFor(cfOrderId, tags, payment) {
  const orderNumber = tags?.orderNumber || orderNumberFromCfOrderId(cfOrderId);
  if (!orderNumber) return null;
  return finalizePaidOrder(String(orderNumber), payment);
}

/** Records a failed/expired/cancelled payment for the right kind of order. */
async function handleFailedPayment(cfOrderId, tags, status) {
  const orderNumber = tags?.orderNumber || orderNumberFromCfOrderId(cfOrderId);
  if (orderNumber) return markOrderPaymentFailed(String(orderNumber), status);
  const invoice = tags?.invoiceNumber || cfOrderId;
  await recordPaymentAlert({
    type: "payment_failed", orderKey: cfOrderId,
    message: `Payment link ${invoice} ${String(status).toLowerCase()}. The customer was not charged; generate a new link if needed.`,
  });
  return true;
}

/**
 * 4. CREATE CASHFREE PAYMENT LINK (POS / Showroom Counter Billing)
 * POST /api/payments/cashfree/create-payment-link
 */
export async function createCashfreePaymentLink(req, res) {
  const {
    amount,
    customerName = "Valued Customer",
    customerPhone = "",
    customerEmail = "customer@rsfashions.in",
    invoiceNumber = `RSF-POS-${Date.now().toString().slice(-6)}`,
    items = [],
    subtotal = 0,
    discount = 0,
    total = 0,
    billingType = "gst",
    customerAddress,
  } = req.body;

  const amountInRupees = Number(amount) || 0;
  if (amountInRupees <= 0) {
    return errorResponse(res, "Valid payment amount is required", 400);
  }

  const cleanPhone = String(customerPhone).replace(/[^0-9]/g, "").slice(-10);
  if (!cleanPhone || cleanPhone.length < 10) {
    return errorResponse(res, "Valid 10-digit customer phone number is required", 400);
  }

  const posKey = `POS_${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  try {
    await acquireLock(posKey);

    // Check if an attempt already exists for this POS invoice
    const history = getPaymentHistory(posKey);
    let attemptNumber = 1;

    if (history && history.attempts.length > 0) {
      const last = history.attempts[history.attempts.length - 1];
      if (last.status === "PAID") {
        return successResponse(res, {
          orderId: last.cfOrderId,
          status: "PAID",
          paid: true,
          amount: last.orderAmount,
          invoiceNumber,
        }, "Invoice is already paid.");
      }

      if (last.status === "PENDING" && last.paymentLinkUrl) {
        return successResponse(res, {
          paymentLink: last.paymentLinkUrl,
          linkUrl: last.paymentLinkUrl,
          paymentLinkId: last.cfOrderId,
          orderId: last.cfOrderId,
          paymentSessionId: last.paymentSessionId,
          amount: amountInRupees,
          invoiceNumber,
          status: "ACTIVE",
          reused: true,
        }, "Existing active payment link reused.");
      }

      attemptNumber = last.attemptNumber + 1;
    }

    const orderId = `RSF_${posKey}_A${attemptNumber}`;
    const publicClientUrl = getPublicClientUrl(req);
    const returnUrl = `${publicClientUrl}/pay?order_id=${orderId}&status=return`;

    const isBenchmarkMock =
      req.headers["x-benchmark-mock"] === "true" || process.env.CASHFREE_MOCK_BENCHMARK === "true";

    const cfOrder = await createCFOrderService({
      orderId,
      orderAmount: amountInRupees,
      orderCurrency: "INR",
      customerDetails: {
        customerId: `cust_${cleanPhone}`,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: cleanPhone,
      },
      orderMeta: {
        returnUrl,
        notifyUrl: `${ENV.BACKEND_URL}/api/payments/cashfree/webhook`,
      },
      orderNote: `RS Fashions Saree Billing #${invoiceNumber}`,
      orderTags: {
        source: "RS_Fashions_Showroom_POS",
        invoiceNumber,
      },
      isMock: isBenchmarkMock,
    });

    const paymentLinkUrl = `${publicClientUrl}/pay?order_id=${orderId}&session_id=${cfOrder.payment_session_id}&amount=${amountInRupees}&invoice=${encodeURIComponent(invoiceNumber)}&customer=${encodeURIComponent(customerName.trim())}`;

    savePaymentAttempt(posKey, {
      attemptNumber,
      cfOrderId: orderId,
      paymentSessionId: cfOrder.payment_session_id,
      paymentLinkUrl,
      orderAmount: amountInRupees,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });

    const pendingSaleData = {
      orderId,
      invoiceNumber,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      customerEmail: customerEmail.trim(),
      customerAddress: customerAddress || req.body.address || "In-Store Showroom Counter",
      items,
      subtotal: Number(subtotal) || amountInRupees,
      discount: Number(discount) || 0,
      total: amountInRupees,
      billingType,
      committed: false,
    };
    await savePendingSale(orderId, pendingSaleData, posKey);

    return successResponse(
      res,
      {
        paymentLink: paymentLinkUrl,
        linkUrl: paymentLinkUrl,
        paymentLinkId: orderId,
        orderId,
        paymentSessionId: cfOrder.payment_session_id,
        amount: amountInRupees,
        invoiceNumber,
        status: cfOrder.order_status || "ACTIVE",
        reused: false,
      },
      "Cashfree payment link generated successfully"
    );
  } catch (err) {
    console.error("[Cashfree Controller] Payment Link Error:", safeErrorMsg(err));
    return errorResponse(res, safeErrorMsg(err), 500);
  } finally {
    releaseLock(posKey);
  }
}

/**
 * 5. CASHFREE WEBHOOK HANDLER (signature-verified on the raw body, de-duplicated in the database)
 * POST /api/payments/cashfree/webhook
 * Works with nobody logged in: a successful payment records the counter sale or finalises the
 * storefront order; a failed payment closes the pending order and raises an admin alert.
 */
export async function handleCashfreeWebhook(req, res) {
  let eventId = null;
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    if (!verifyCashfreeWebhookSignature(req.rawBody || req.body, timestamp, signature)) {
      console.warn("[Cashfree Webhook] Invalid webhook signature received.");
      return errorResponse(res, "Invalid webhook signature", 401);
    }

    const event = req.body || {};
    const eventType = event.type || event.event || "UNKNOWN";
    const orderData = event.data?.order || {};
    const paymentData = event.data?.payment || {};
    const cfOrderId = orderData.order_id || paymentData.order_id;
    const tags = orderData.order_tags || {};
    const paymentStatus = String(paymentData.payment_status || orderData.order_status || "").toUpperCase();
    eventId =
      paymentData.cf_payment_id ||
      paymentData.payment_id ||
      event.event_id ||
      `evt_${cfOrderId}_${paymentStatus}_${timestamp || Date.now()}`;
    eventId = `${eventId}:${paymentStatus}`;

    // Atomic claim: a duplicate delivery (or two instances) can never process an event twice.
    const isFirst = await claimWebhookEvent(String(eventId), { cfOrderId, eventType, paymentStatus });
    if (!isFirst) {
      return successResponse(res, { received: true, deduplicated: true, eventId }, "Webhook event already processed (idempotent response)");
    }

    if (cfOrderId) {
      if (paymentStatus === "SUCCESS") {
        await autoRecordPosSale(cfOrderId, eventId);
        await finalizeOnlineOrderFor(cfOrderId, tags, { paymentId: eventId, paymentMethod: "cashfree", paymentDetails: paymentData });
        updatePaymentAttemptStatus(cfOrderId, "PAID", { paymentId: eventId, paymentDetails: paymentData });
        markOrderPaidInStore(cfOrderId, { paymentId: eventId, paymentMethod: "cashfree", paymentDetails: paymentData });
        console.log(`[Cashfree Webhook] Order ${cfOrderId} transitioned to PAID via event ${eventType}`);
      } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED" || paymentStatus === "EXPIRED" || paymentStatus === "USER_DROPPED") {
        // An out-of-order failure must never downgrade an already paid order
        // (markOrderPaymentFailed only touches orders that are still pending).
        const history = getPaymentHistory(cfOrderId);
        const isAlreadyPaid =
          history?.currentStatus === "PAID" ||
          history?.attempts?.some((a) => a.cfOrderId === cfOrderId && a.status === "PAID");
        if (!isAlreadyPaid) {
          updatePaymentAttemptStatus(cfOrderId, paymentStatus);
          await handleFailedPayment(cfOrderId, tags, paymentStatus);
        }
      }
    }

    return successResponse(res, { received: true, processed: true, eventId }, "Webhook processed successfully");
  } catch (err) {
    console.error("[Cashfree Webhook Error]:", err);
    // Let Cashfree's retry process this event again.
    if (eventId) await releaseWebhookEvent(String(eventId)).catch(() => {});
    return errorResponse(res, "Webhook processing error", 500);
  }
}

/**
 * 6. FINALIZE A STOREFRONT ORDER AFTER PAYMENT
 * POST /api/payments/cashfree/finalize { orderNumber, cfOrderId }
 * The server asks Cashfree itself whether the payment succeeded (the browser's word is not trusted),
 * then marks the order paid exactly once. Safe to call repeatedly / alongside the webhook.
 */
export async function finalizeCashfreeOrder(req, res) {
  try {
    const orderNumber = String(req.body?.orderNumber || "").trim();
    let cfOrderId = String(req.body?.cfOrderId || "").trim();
    if (!orderNumber) return errorResponse(res, "orderNumber is required", 400);
    if (!cfOrderId) {
      const attempts = getPaymentHistory(orderNumber)?.attempts || [];
      cfOrderId = attempts[attempts.length - 1]?.cfOrderId || "";
    }
    if (!cfOrderId) return successResponse(res, { paid: false, found: false }, "No payment found for this order");
    if (orderNumberFromCfOrderId(cfOrderId) !== orderNumber) {
      return errorResponse(res, "Payment does not belong to this order", 400);
    }

    const orderData = await getCashfreeOrder(cfOrderId);
    const payments = await getCashfreeOrderPayments(cfOrderId);
    const success = payments.find((p) => String(p.payment_status).toUpperCase() === "SUCCESS");
    const isPaid = orderData.order_status === "PAID" || Boolean(success);
    if (!isPaid) {
      return successResponse(res, { paid: false, found: true, orderStatus: orderData.order_status || "ACTIVE" }, "Payment not completed");
    }

    const result = await finalizePaidOrder(orderNumber, { paymentId: success?.payment_id || cfOrderId, paymentMethod: "cashfree", paymentDetails: success || {} });
    return successResponse(res, { paid: true, found: Boolean(result.found), finalized: Boolean(result.finalized), orderNumber }, "Order confirmed");
  } catch (err) {
    console.error("[Cashfree Controller] Finalize error:", safeErrorMsg(err));
    return errorResponse(res, safeErrorMsg(err), 500);
  }
}
