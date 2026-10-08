import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// Fake credentials for the test process only (not real keys).
process.env.RAZORPAY_KEY_ID = "rzp_test_unittestkey01";
process.env.RAZORPAY_KEY_SECRET = "unit_test_secret_value";
process.env.RAZORPAY_WEBHOOK_SECRET = "unit_test_webhook_secret";

const {
  verifyPaymentSignature,
  verifyWebhookSignature,
  toPaise,
  toGatewayError,
  createRazorpayOrder,
} = await import("../src/services/razorpay.service.js");
const { createOrder, verifyPayment, handleWebhook } = await import("../src/controllers/payments.controller.js");

const sign = (data, secret) => crypto.createHmac("sha256", secret).update(data).digest("hex");

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    locals: {},
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("checkout signature: only HMAC(order|payment, key secret) is accepted", () => {
  const good = sign("order_ABC123|pay_XYZ789", process.env.RAZORPAY_KEY_SECRET);
  assert.equal(verifyPaymentSignature("order_ABC123", "pay_XYZ789", good), true);
  assert.equal(verifyPaymentSignature("order_ABC123", "pay_OTHER1", good), false, "different payment id");
  assert.equal(verifyPaymentSignature("order_ABC123", "pay_XYZ789", sign("order_ABC123|pay_XYZ789", "wrong")), false);
  assert.equal(verifyPaymentSignature("order_ABC123", "pay_XYZ789", ""), false);
  assert.equal(verifyPaymentSignature("order_ABC123", "pay_XYZ789", good.slice(0, 10)), false, "length mismatch");
});

test("webhook signature is checked over the raw body with the webhook secret", () => {
  const raw = Buffer.from(JSON.stringify({ event: "payment.captured" }));
  assert.equal(verifyWebhookSignature(raw, sign(raw, process.env.RAZORPAY_WEBHOOK_SECRET)), true);
  assert.equal(verifyWebhookSignature(raw, sign(raw, process.env.RAZORPAY_KEY_SECRET)), false, "key secret is not the webhook secret");
  assert.equal(verifyWebhookSignature(raw, undefined), false);
});

test("amounts become integer paise; invalid amounts are rejected", async () => {
  assert.equal(toPaise(1999), 199900);
  assert.equal(toPaise("10.5"), 1050);
  assert.equal(toPaise(0), 0);
  assert.equal(toPaise(-5), 0);
  assert.equal(toPaise("abc"), 0);
  await assert.rejects(() => createRazorpayOrder({ amountPaise: 99, receipt: "r" }), (e) => e.statusCode === 400);
  await assert.rejects(() => createRazorpayOrder({ amountPaise: 150.5, receipt: "r" }), (e) => e.statusCode === 400);
});

test("gateway errors map to safe statuses (auth 401, network 503) without leaking details", () => {
  assert.equal(toGatewayError({ statusCode: 401, error: { description: "Authentication failed" } }).statusCode, 401);
  assert.equal(toGatewayError({ statusCode: 500 }).statusCode, 502);
  const net = toGatewayError(new Error("connect ECONNREFUSED"));
  assert.equal(net.statusCode, 503);
  assert.doesNotMatch(net.message, /ECONNREFUSED/);
});

test("verify-payment: missing fields -> 400", async () => {
  const res = mockRes();
  await verifyPayment({ body: { razorpay_order_id: "order_ABC123" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("verify-payment: wrong signature -> 400 and nothing is marked paid", async () => {
  const res = mockRes();
  await verifyPayment({
    body: { razorpay_order_id: "order_ABC123", razorpay_payment_id: "pay_XYZ789", razorpay_signature: "f".repeat(64) },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /verification failed/i);
  assert.equal(res.body.paid, undefined);
});

test("create-order: a bad order number or non-INR currency -> 400 before calling Razorpay", async () => {
  const bad = mockRes();
  await createOrder({ body: { orderNumber: "x" } }, bad);
  assert.equal(bad.statusCode, 400);

  const usd = mockRes();
  await createOrder({ body: { orderNumber: "001", currency: "USD" } }, usd);
  assert.equal(usd.statusCode, 400);
});

test("create-order / verify: 503 when the server has no Razorpay keys", async () => {
  const saved = process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_KEY_SECRET;
  try {
    const res = mockRes();
    await createOrder({ body: { orderNumber: "001" } }, res);
    assert.equal(res.statusCode, 503);
    assert.doesNotMatch(JSON.stringify(res.body), /rzp_|secret/i);
  } finally {
    process.env.RAZORPAY_KEY_SECRET = saved;
  }
});

test("webhook: invalid signature -> 400, nothing processed", async () => {
  const raw = Buffer.from(JSON.stringify({ event: "payment.captured", payload: {} }));
  const res = mockRes();
  await handleWebhook({ body: JSON.parse(raw), rawBody: raw, headers: { "x-razorpay-signature": "bad" } }, res);
  assert.equal(res.statusCode, 400);
});

test("no response from these endpoints ever contains the key secret", async () => {
  const res = mockRes();
  await verifyPayment({ body: { razorpay_order_id: "order_ABC123", razorpay_payment_id: "pay_XYZ789", razorpay_signature: "x" } }, res);
  assert.doesNotMatch(JSON.stringify(res.body), new RegExp(process.env.RAZORPAY_KEY_SECRET));
});
