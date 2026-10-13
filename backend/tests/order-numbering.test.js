/**
 * Online orders get their invoice number only when paid, so an abandoned checkout never leaves a
 * gap in the 001, 002, 003… sequence shared with counter sales.
 */
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.SUPABASE_ANON_KEY = "";
process.env.NODE_ENV = "test";

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Isolated local store: last invoice so far is 116 (a counter sale).
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "rsf-numbering-"));
process.env.RS_LOCAL_DATA_DIR = DATA_DIR;
fs.writeFileSync(path.join(DATA_DIR, "orders.json"), JSON.stringify([
  { id: "inv-counter-116", order_number: "116", invoice_number: "116", payment_method: "cash", payment_status: "completed", total: 6830, items: [] },
]));

const { createPendingOrder, finalizePaidOrder, getOrder, isTemporaryOrderRef } = await import("../src/services/onlineOrders.js");
const { peekNextOrderNumber } = await import("../src/services/orderNumber.js");

const checkout = (extra = {}) => createPendingOrder({
  orderNumber: `RSF-ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  customerName: "Test Shopper",
  phone: "+91 98765 43210",
  items: [{ id: "no-such-saree", productId: "no-such-saree", name: "Test Saree", quantity: 1, price: 2800 }],
  subtotal: 2800,
  total: 2800,
  festivalDiscount: 0,
  ...extra,
});

test("starting a checkout gives a temporary reference, not an invoice number", async () => {
  const out = await checkout();
  assert.equal(out.status, 201);
  assert.ok(isTemporaryOrderRef(out.body.orderNumber), out.body.orderNumber);
  assert.doesNotMatch(out.body.orderNumber, /^\d+$/);
  assert.equal(await peekNextOrderNumber(), "117", "an unpaid checkout must not use up 117");
});

test("abandoned checkouts leave no gap; the paid one gets the next number", async () => {
  const abandoned1 = await checkout();
  const abandoned2 = await checkout();
  const paid = await checkout();
  assert.equal(await peekNextOrderNumber(), "117");

  const result = await finalizePaidOrder(paid.body.orderNumber, { paymentId: "pay_TEST1", paymentMethod: "razorpay" });
  assert.equal(result.finalized, true);
  assert.equal(result.orderNumber, "117");
  assert.equal(await peekNextOrderNumber(), "118");

  // The abandoned ones are still unnumbered and unpaid.
  for (const a of [abandoned1, abandoned2]) {
    const o = await getOrder(a.body.orderNumber);
    assert.equal(o.payment_status, "pending");
    assert.ok(isTemporaryOrderRef(o.order_number));
  }
});

test("repeated payment notices keep the same number; the reference still finds the order", async () => {
  const paid = await checkout();
  const ref = paid.body.orderNumber;
  const first = await finalizePaidOrder(ref, { paymentId: "pay_TEST2" });
  const again = await finalizePaidOrder(ref, { paymentId: "pay_TEST2" });
  assert.equal(first.orderNumber, "118");
  assert.equal(again.already, true);
  assert.equal(again.orderNumber, "118", "a duplicate webhook must not renumber");

  const byRef = await getOrder(ref);
  const byNumber = await getOrder("118");
  assert.equal(byRef.id, byNumber.id);
  assert.equal(byRef.order_number, "118");
  assert.equal(byRef.payment_status, "paid");
  assert.equal(await peekNextOrderNumber(), "119");
});

test("a retry of the same checkout updates the order instead of creating another", async () => {
  const first = await checkout();
  const retry = await checkout({ orderNumber: first.body.orderNumber, total: 2800 });
  assert.equal(retry.status, 201);
  assert.equal(retry.body.orderNumber, first.body.orderNumber);

  await finalizePaidOrder(first.body.orderNumber, { paymentId: "pay_TEST3" });
  const afterPaid = await checkout({ orderNumber: first.body.orderNumber });
  assert.equal(afterPaid.body.alreadyPaid, true);
  assert.equal(afterPaid.body.orderNumber, "119", "an already-paid retry reports the invoice number");
});

test("unknown references are rejected safely", async () => {
  assert.deepEqual(await finalizePaidOrder("ord-doesnot-exist", {}), { found: false });
  assert.deepEqual(await finalizePaidOrder("bad,key", {}), { found: false });
  assert.equal(await getOrder("x,id.neq.0"), null);
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});
