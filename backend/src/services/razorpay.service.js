/**
 * Service: Razorpay (Standard Web Checkout) via the official Node SDK.
 * Every call that touches money runs here, on the server. The browser only ever receives the
 * public KEY_ID and a Razorpay order id; KEY_SECRET and WEBHOOK_SECRET never leave this process
 * and are never logged.
 */
import crypto from "crypto";
import Razorpay from "razorpay";
import { ENV } from "../config/env.js";

export const RAZORPAY_CURRENCY = "INR";
export const MIN_AMOUNT_PAISE = 100;

/** Error with an HTTP status the controller can pass straight to the client. */
export class PaymentGatewayError extends Error {
  constructor(message, statusCode = 502, gatewayStatus) {
    super(message);
    this.statusCode = statusCode;
    this.gatewayStatus = gatewayStatus;
  }
}

let client = null;
let clientKey = "";
let testClient = null;

/** Tests only: replace the SDK with an in-memory fake (null restores the real one). */
export function setRazorpayClientForTests(fake) {
  if (process.env.NODE_ENV !== "test") throw new Error("setRazorpayClientForTests is only available in tests");
  testClient = fake;
}

function getClient() {
  if (testClient) return testClient;
  if (!ENV.RAZORPAY.isConfigured) {
    throw new PaymentGatewayError("Online payment is not configured on the server.", 503);
  }
  // Rebuild if the keys changed (e.g. test -> live without a restart in tests).
  if (!client || clientKey !== ENV.RAZORPAY.KEY_ID) {
    client = new Razorpay({ key_id: ENV.RAZORPAY.KEY_ID, key_secret: ENV.RAZORPAY.KEY_SECRET });
    clientKey = ENV.RAZORPAY.KEY_ID;
  }
  return client;
}

/** Rupees (number) -> integer paise, rejecting anything that is not a positive amount. */
export function toPaise(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

/**
 * Maps an SDK / network error to a safe message + status. Razorpay's own description is kept for
 * logs and Sentry only; nothing that could contain credentials is ever returned.
 */
export function toGatewayError(err) {
  if (err instanceof PaymentGatewayError) return err;
  const status = Number(err?.statusCode) || 0;
  const description = String(err?.error?.description || err?.message || "Razorpay request failed");
  if (status === 401) {
    return new PaymentGatewayError("Payment gateway authentication failed.", 401, status);
  }
  if (status >= 400 && status < 500) {
    return new PaymentGatewayError(`Payment gateway rejected the request: ${description}`, 502, status);
  }
  if (!status) {
    return new PaymentGatewayError("Could not reach the payment gateway. Please try again.", 503);
  }
  return new PaymentGatewayError("Payment gateway error. Please try again.", 502, status);
}

async function call(fn) {
  try {
    return await fn(getClient());
  } catch (err) {
    throw toGatewayError(err);
  }
}

/** POST /v1/orders. `notes` is how the webhook later finds our order, so it is set only here. */
export async function createRazorpayOrder({ amountPaise, receipt, notes = {} }) {
  if (!Number.isInteger(amountPaise) || amountPaise < MIN_AMOUNT_PAISE) {
    throw new PaymentGatewayError("Payment amount must be at least ₹1.", 400);
  }
  return call((rzp) =>
    rzp.orders.create({ amount: amountPaise, currency: RAZORPAY_CURRENCY, receipt: String(receipt).slice(0, 40), notes })
  );
}

export const fetchRazorpayOrder = (orderId) => call((rzp) => rzp.orders.fetch(orderId));
export const fetchRazorpayPayment = (paymentId) => call((rzp) => rzp.payments.fetch(paymentId));
export const fetchRazorpayOrderPayments = (orderId) =>
  call((rzp) => rzp.orders.fetchPayments(orderId)).then((r) => (Array.isArray(r?.items) ? r.items : []));
export const captureRazorpayPayment = (paymentId, amountPaise) =>
  call((rzp) => rzp.payments.capture(paymentId, amountPaise, RAZORPAY_CURRENCY));

function safeEqualHex(expected, received) {
  const a = Buffer.from(String(expected), "utf8");
  const b = Buffer.from(String(received || ""), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Checkout handler signature: HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET). */
export function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature) {
  const secret = ENV.RAZORPAY.KEY_SECRET;
  if (!secret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw request body, WEBHOOK_SECRET) in X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = ENV.RAZORPAY.WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody || {}));
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return safeEqualHex(expected, signature);
}

/**
 * Server-side truth for a Razorpay order: is there a captured payment for the full amount?
 * An "authorized" payment of the right amount is captured here so money is never left hanging
 * (Razorpay auto-refunds uncaptured payments). Returns { paid, payment, order }.
 */
export async function confirmOrderPayment(razorpayOrderId, { preferPaymentId } = {}) {
  const order = await fetchRazorpayOrder(razorpayOrderId);
  const payments = await fetchRazorpayOrderPayments(razorpayOrderId);
  const ordered = preferPaymentId
    ? [...payments.filter((p) => p.id === preferPaymentId), ...payments.filter((p) => p.id !== preferPaymentId)]
    : payments;

  for (const p of ordered) {
    if (p.order_id !== order.id || Number(p.amount) !== Number(order.amount) || p.currency !== order.currency) continue;
    if (p.status === "captured") return { paid: true, payment: p, order };
    if (p.status === "authorized") {
      try {
        const captured = await captureRazorpayPayment(p.id, Number(order.amount));
        if (captured?.status === "captured") return { paid: true, payment: captured, order };
      } catch (err) {
        // Captured meanwhile by Razorpay's auto-capture or a parallel request: re-read it.
        const fresh = await fetchRazorpayPayment(p.id).catch(() => null);
        if (fresh?.status === "captured") return { paid: true, payment: fresh, order };
        throw err;
      }
    }
  }
  const latest = payments[0] || null;
  return { paid: false, payment: latest, order };
}
