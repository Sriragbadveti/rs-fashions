/**
 * SKU allocation (RS0001 format) and CRM customer save/validation tests.
 *
 * Run from backend/:  node --test tests/
 *
 * Always runs against the local JSON store: Supabase variables are blanked before the app is
 * imported (dotenv never overrides existing variables), so these tests can't touch a real
 * database. The local data files are restored afterwards.
 */
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.SUPABASE_ANON_KEY = "";
process.env.ADMIN_JWT_SECRET = "sku-test-secret";
process.env.NODE_ENV = "test";

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../src/database/data");
const backups = new Map();

let server;
let baseUrl;
let authHeader;
let sku;

before(async () => {
  for (const f of fs.readdirSync(DATA_DIR)) {
    backups.set(f, fs.readFileSync(path.join(DATA_DIR, f)));
  }
  fs.writeFileSync(path.join(DATA_DIR, "products.json"), "[]");

  const express = (await import("express")).default;
  const { default: apiRouter } = await import("../src/routes/index.js");
  const { generateAdminToken } = await import("../src/middleware/adminAuth.js");
  sku = await import("../src/services/sku.service.js");

  const app = express();
  app.use(express.json());
  app.use("/api", apiRouter);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  authHeader = `Bearer ${generateAdminToken({ id: "t", name: "Test", email: "t@test" }).token}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  const current = new Set(fs.readdirSync(DATA_DIR));
  for (const [f, buf] of backups) fs.writeFileSync(path.join(DATA_DIR, f), buf);
  for (const f of current) if (!backups.has(f)) fs.unlinkSync(path.join(DATA_DIR, f));
});

async function api(method, url, body, { auth = true } = {}) {
  const res = await fetch(`${baseUrl}${url}`, {
    method,
    // X-Allow-Bulk-Create is what the admin dashboard sends; without it the create endpoint
    // rate-limits bursts (3 per 10s), which the concurrency test deliberately exceeds.
    headers: {
      "Content-Type": "application/json",
      "X-Allow-Bulk-Create": "true",
      ...(auth ? { Authorization: authHeader } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const product = (extra = {}) => ({
  name: "Test Saree",
  salePrice: 1000,
  variants: [{ color: "Red", colorSlug: "RED", stock: 2, sku: "" }],
  ...extra,
});

// ------------------------------------------------------------------------------------------
// Format helpers
// ------------------------------------------------------------------------------------------
test("isValidSku accepts only RS + four digits", () => {
  for (const good of ["RS0001", "RS0123", "RS9999"]) assert.equal(sku.isValidSku(good), true, good);
  for (const bad of ["RS0000", "RS001", "RS00001", "rs0001", "RS-0001", "RSF-VC-RED-001", "RS 0001", "", null, undefined, 1]) {
    assert.equal(sku.isValidSku(bad), false, String(bad));
  }
  assert.equal(sku.formatSku(1), "RS0001");
  assert.equal(sku.formatSku(9999), "RS9999");
  assert.throws(() => sku.formatSku(10000), RangeError);
  assert.throws(() => sku.formatSku(0), RangeError);
});

// ------------------------------------------------------------------------------------------
// Product creation
// ------------------------------------------------------------------------------------------
test("new product gets a server-allocated RS SKU; every variant gets its own", async () => {
  const r = await api("POST", "/catalog", product({
    variants: [
      { color: "Red", colorSlug: "RED", stock: 1, sku: "" },
      { color: "Blue", colorSlug: "BLU", stock: 1, sku: "" },
      { color: "Green", colorSlug: "GRN", stock: 1, sku: "RSF-X-GRN-001" },
    ],
  }));
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const p = r.body.product;
  assert.match(p.id, /^RS\d{4}$/);
  const skus = p.variants.map((v) => v.sku);
  assert.ok(skus.every((s) => /^RS\d{4}$/.test(s)), skus.join(","));
  assert.equal(new Set(skus).size, 3, "variant SKUs are unique");
  assert.equal(skus[0], p.id, "first variant shares the product SKU");
});

test("concurrent product creation never produces duplicate SKUs", async () => {
  const results = await Promise.all(Array.from({ length: 25 }, () => api("POST", "/catalog", product())));
  for (const r of results) assert.equal(r.status, 201, JSON.stringify(r.body));
  const ids = results.map((r) => r.body.product.id);
  assert.equal(new Set(ids).size, ids.length, "all 25 SKUs distinct");
  assert.ok(ids.every(sku.isValidSku));
});

test("invalid SKUs supplied by a client are rejected", async () => {
  for (const bad of ["RSF-VC-RED-001", "RS12", "RS00001", "RS-0001", "AB0001", "RS0000"]) {
    const r = await api("POST", "/catalog", product({ id: bad }));
    assert.equal(r.status, 400, `${bad}: ${JSON.stringify(r.body)}`);
    assert.match(r.body.message, /"RS" followed by exactly four digits/);
  }
});

test("an explicitly requested valid SKU is used once; reuse is refused; lowercase is normalised", async () => {
  const first = await api("POST", "/catalog", product({ sku: "rs0500" }));
  assert.equal(first.status, 201, JSON.stringify(first.body));
  assert.equal(first.body.product.id, "RS0500");

  const dup = await api("POST", "/catalog", product({ sku: "RS0500" }));
  assert.equal(dup.status, 409);

  const next = await api("POST", "/catalog", product());
  assert.equal(next.body.product.id, "RS0501", "allocation continues after the highest SKU and never reuses lower gaps");
});

test("unauthenticated product creation is refused", async () => {
  const r = await api("POST", "/catalog", product(), { auth: false });
  assert.equal(r.status, 401);
});

// ------------------------------------------------------------------------------------------
// Editing preserves SKUs
// ------------------------------------------------------------------------------------------
test("editing keeps existing SKUs and allocates SKUs only for new shades", async () => {
  const created = (await api("POST", "/catalog", product())).body.product;
  const r = await api("PUT", `/catalog/${created.id}`, {
    id: "RS9990", // a client can't change the product's ID
    name: "Edited",
    variants: [
      ...created.variants,
      { color: "Blue", colorSlug: "BLU", stock: 3, sku: "" },
      { color: "Pink", colorSlug: "PNK", stock: 3, sku: "RS0001" }, // not this product's SKU
    ],
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const vs = (await api("GET", "/catalog/products")).body.products.find((p) => p.id === created.id).variants;
  assert.equal(vs[0].sku, created.id, "existing SKU preserved");
  assert.match(vs[1].sku, /^RS\d{4}$/);
  assert.notEqual(vs[2].sku, "RS0001", "a SKU belonging to another product is not taken over");
  assert.equal(new Set(vs.map((v) => v.sku)).size, 3);
  const products = (await api("GET", "/catalog/products")).body.products;
  assert.ok(!products.some((p) => p.id === "RS9990"), "product ID unchanged");
});

test("legacy (pre-RS) products keep their SKUs when edited", async () => {
  const storePath = path.join(DATA_DIR, "products.json");
  const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
  store.unshift({
    id: "RSF-VC-RED-001", name: "Legacy", price: 900, salePrice: 900, stock: 1, colors: ["Red"],
    variants: [{ color: "Red", colorSlug: "RED", stock: 1, sku: "RSF-VC-RED-001" }],
  });
  fs.writeFileSync(storePath, JSON.stringify(store));

  const r = await api("PUT", "/catalog/RSF-VC-RED-001", {
    salePrice: 950,
    variants: [
      { color: "Red", colorSlug: "RED", stock: 4, sku: "RSF-VC-RED-001" },
      { color: "Gold", colorSlug: "GLD", stock: 1, sku: "" },
    ],
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const legacy = (await api("GET", "/catalog/products")).body.products.find((p) => p.id === "RSF-VC-RED-001");
  assert.equal(legacy.variants[0].sku, "RSF-VC-RED-001", "legacy SKU not overwritten");
  assert.match(legacy.variants[1].sku, /^RS\d{4}$/, "new shade on a legacy product gets an RS SKU");
});

// ------------------------------------------------------------------------------------------
// Bulk intake
// ------------------------------------------------------------------------------------------
test("bulk intake allocates unique SKUs per row and reports results by clientRef", async () => {
  const r = await api("POST", "/inventory/bulk-intake", {
    borderColor: "Royal Gold Zari",
    products: [
      { clientRef: "row-a", ...product() },
      { clientRef: "row-b", ...product() },
      { clientRef: "row-c", ...product({ sku: "BAD-SKU" }) },
      { clientRef: "row-d", ...product() },
    ],
  });
  assert.equal(r.status, 207, JSON.stringify(r.body));
  const inserted = r.body.inserted;
  assert.deepEqual(inserted.map((x) => x.clientRef).sort(), ["row-a", "row-b", "row-d"]);
  assert.ok(inserted.every((x) => /^RS\d{4}$/.test(x.id)));
  assert.equal(new Set(inserted.map((x) => x.id)).size, 3);
  assert.equal(r.body.failed.length, 1);
  assert.equal(r.body.failed[0].clientRef, "row-c");
});

test("duplicate SKUs inside one bulk import are rejected", async () => {
  const r = await api("POST", "/inventory/bulk-intake", {
    products: [
      { clientRef: "x1", ...product({ sku: "RS7000" }) },
      { clientRef: "x2", ...product({ sku: "RS7000" }) },
    ],
  });
  assert.equal(r.status, 207, JSON.stringify(r.body));
  assert.deepEqual(r.body.inserted.map((x) => x.clientRef), ["x1"]);
  assert.equal(r.body.failed[0].clientRef, "x2");
  assert.match(r.body.failed[0].error, /already assigned/);
});

// ------------------------------------------------------------------------------------------
// CRM customers (birthday / anniversary)
// ------------------------------------------------------------------------------------------
test("customer birthday/anniversary dates are validated and normalised", async () => {
  const year = new Date().getUTCFullYear();
  const ok = await api("POST", "/crm/customers", {
    name: "Test Customer", phone: "9876543210", birthday: `${year}-12-31`, anniversary: "2015-10-03",
  });
  assert.equal(ok.status, 201, "a birthday picked in the current year (year unknown) is accepted");
  assert.equal(ok.body.customer.birthday, `${year}-12-31`);
  assert.equal(ok.body.customer.anniversary, "2015-10-03", "anniversary is returned");

  for (const [field, value] of [["birthday", "not-a-date"], ["birthday", `${year + 1}-01-01`], ["anniversary", "1850-01-01"], ["anniversary", "garbage"]]) {
    const r = await api("POST", "/crm/customers", { name: "Bad", phone: "9876543211", [field]: value });
    assert.equal(r.status, 400, `${field}=${value}: ${JSON.stringify(r.body)}`);
  }
});

test("customer list requires admin authentication", async () => {
  assert.equal((await api("GET", "/crm/customers", undefined, { auth: false })).status, 401);
  assert.equal((await api("GET", "/crm/customers")).status, 200);
});

// ------------------------------------------------------------------------------------------
// Bulk intake with multiple photos per product
// ------------------------------------------------------------------------------------------
test("bulk intake: 10 rows with extra photos create exactly 10 products, each with its own photos", async () => {
  const before = (await api("GET", "/catalog/products")).body.products.length;
  const extras = { 0: 4, 1: 2, 2: 5 }; // rows 1–3 get additional photos, rows 4–10 have one
  const rows = Array.from({ length: 10 }, (_, i) => {
    const images = [`https://cdn.test/row${i}-primary.jpg`];
    for (let k = 0; k < (extras[i] || 0); k++) images.push(`https://cdn.test/row${i}-extra${k}.jpg`);
    images.push(`blob:http://localhost/preview-${i}`); // local previews must never be stored
    return { clientRef: `multi-row-${i}`, ...product({ imageUrl: images[0], images }) };
  });
  const r = await api("POST", "/inventory/bulk-intake", { products: rows });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.inserted.length, 10);

  const all = (await api("GET", "/catalog/products")).body.products;
  assert.equal(all.length, before + 10, "exactly 10 products created (not 21)");
  for (const { clientRef, id } of r.body.inserted) {
    const i = Number(clientRef.split("-").pop());
    const p = all.find((x) => x.id === id);
    assert.equal(p.images.length, 1 + (extras[i] || 0), `row ${i} photo count`);
    assert.equal(p.images[0], `https://cdn.test/row${i}-primary.jpg`, `row ${i} primary preserved`);
    assert.ok(p.images.every((u) => u.includes(`/row${i}-`)), `row ${i} has only its own photos`);
  }
});

test("bulk intake: retrying rows that were already saved does not create duplicates", async () => {
  const rows = [
    { clientRef: "retry-row-a", ...product({ images: ["https://cdn.test/a.jpg", "https://cdn.test/a2.jpg"] }) },
    { clientRef: "retry-row-b", ...product({ images: ["https://cdn.test/b.jpg"] }) },
  ];
  const first = await api("POST", "/inventory/bulk-intake", { products: rows });
  assert.equal(first.status, 201);
  const count = (await api("GET", "/catalog/products")).body.products.length;

  const retry = await api("POST", "/inventory/bulk-intake", { products: rows });
  assert.equal(retry.status, 201, JSON.stringify(retry.body));
  assert.deepEqual(
    retry.body.inserted.map((x) => x.id).sort(),
    first.body.inserted.map((x) => x.id).sort(),
    "retry returns the SKUs already created"
  );
  assert.equal((await api("GET", "/catalog/products")).body.products.length, count, "no new products on retry");
});

test("bulk intake: too many photos for one product is rejected for that row only", async () => {
  const many = Array.from({ length: 21 }, (_, k) => `https://cdn.test/m${k}.jpg`);
  const r = await api("POST", "/inventory/bulk-intake", {
    products: [
      { clientRef: "too-many", ...product({ images: many }) },
      { clientRef: "fine", ...product({ images: ["https://cdn.test/ok.jpg"] }) },
    ],
  });
  assert.equal(r.status, 207, JSON.stringify(r.body));
  assert.deepEqual(r.body.inserted.map((x) => x.clientRef), ["fine"]);
  assert.match(r.body.failed[0].error, /at most 20/);
});

// ------------------------------------------------------------------------------------------
// CRM customers (birthday / anniversary)
// ------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------
// Bulk intake with multiple photos per product
// ------------------------------------------------------------------------------------------
test("checkout refuses to sell more sarees than are in stock", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 1, sku: "" }] }))).body.product;
  const line = (qty) => ({ id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: qty, qty, price: 1000 });
  const order = (qty) => api("POST", "/billing/checkout", { customerPhone: "9876543210", items: [line(qty)], total: 1000 * qty }, { auth: false });

  const check = await api("POST", "/billing/check-stock", { items: [line(25)] }, { auth: false });
  assert.equal(check.body.available, false);
  assert.equal(check.body.shortages[0].available, 1);
  assert.equal((await api("POST", "/billing/check-stock", { items: [line(1)] }, { auth: false })).body.available, true);

  const tooMany = await order(25);
  assert.equal(tooMany.status, 409, JSON.stringify(tooMany.body));
  assert.equal(tooMany.body.code, "INSUFFICIENT_STOCK");
  assert.match(tooMany.body.message, /only 1 available/);

  const ok = await order(1);
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  const soldOut = await order(1);
  assert.equal(soldOut.status, 409, "the last piece cannot be sold twice");
  assert.match(soldOut.body.message, /out of stock/);
});

test("two customers racing for the last saree: only one wins, and the hold expires by being released", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 1, sku: "" }] }))).body.product;
  const line = { id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 };
  const hold = (sessionId) => api("POST", "/billing/check-stock", { items: [line], sessionId }, { auth: false });
  const buy = (sessionId) => api("POST", "/billing/checkout", { customerPhone: "9876543210", items: [line], total: 1000, session_id: sessionId }, { auth: false });

  // Both press "pay" at the same moment: exactly one gets the reservation.
  const [a, b] = await Promise.all([hold("sess-A"), hold("sess-B")]);
  const winners = [a, b].filter((r) => r.body.available);
  assert.equal(winners.length, 1, "exactly one customer reserves the last piece");
  const loser = [a, b].find((r) => !r.body.available);
  assert.equal(loser.body.shortages[0].heldByOthers, true, "the loser is told it is held by another customer");

  const winnerSession = a.body.available ? "sess-A" : "sess-B";
  const loserSession = winnerSession === "sess-A" ? "sess-B" : "sess-A";

  // The loser cannot buy it while the winner's hold is active, even by calling checkout directly.
  assert.equal((await buy(loserSession)).status, 409);
  // The winner can.
  assert.equal((await buy(winnerSession)).status, 201);
  // Now it is genuinely sold out.
  assert.equal((await hold(loserSession)).body.available, false);
});

test("an abandoned reservation frees the saree for the next customer", async () => {
  const inv = await import("../src/services/inventory.service.js");
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 1, sku: "" }] }))).body.product;
  const items = [{ id: created.id, productId: created.id, color: "Red", quantity: 1 }];
  assert.deepEqual(await inv.holdStock(items, "sess-X"), []);
  assert.equal((await inv.holdStock(items, "sess-Y")).length, 1, "held for X, so unavailable to Y");
  const realNow = Date.now;
  Date.now = () => realNow() + 11 * 60 * 1000; // 11 minutes later: X never paid
  try {
    assert.deepEqual(await inv.holdStock(items, "sess-Y"), [], "hold timed out, Y can reserve it");
  } finally {
    Date.now = realNow;
  }
});

test("catalog listing supports card view, single product and pagination", async () => {
  await api("POST", "/catalog", product({ images: ["https://cdn.test/1.jpg", "https://cdn.test/2.jpg", "https://cdn.test/3.jpg", "https://cdn.test/4.jpg"] }));
  const full = (await api("GET", "/catalog/products")).body;
  const card = (await api("GET", "/catalog/products?view=card")).body.products;
  assert.ok(full.products.some((p) => p.images.length > 2));
  assert.ok(card.every((p) => p.images.length <= 2), "card view sends at most 2 photos per saree");
  const target = full.products.find((p) => p.images.length > 2);
  const one = (await api("GET", `/catalog/products?id=${target.id}`)).body.products;
  assert.deepEqual(one.map((p) => p.id), [target.id]);
  assert.equal(one[0].images.length, target.images.length, "single-product fetch keeps every photo");
  const paged = (await api("GET", "/catalog/products?limit=2&page=1")).body;
  assert.equal(paged.products.length, 2);
  assert.equal(paged.total, full.products.length);
  assert.equal(paged.pages, Math.ceil(full.products.length / 2));
});

test("online payment: pending order, webhook finalises once, duplicates and late failures are harmless", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 2, sku: "" }] }))).body.product;
  const items = [{ id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 }];
  const clientKey = `RSF-ORD-T${Date.now().toString(36).toUpperCase()}`;
  const stockOf = async () => (await api("GET", "/catalog/products")).body.products.find((p) => p.id === created.id).stock;

  const pending = await api("POST", "/billing/pending-order", { orderNumber: clientKey, customerPhone: "9876543210", customerName: "Tester", items, total: 1000, sessionId: "sess-pay" }, { auth: false });
  assert.equal(pending.status, 201, JSON.stringify(pending.body));
  // The server replaces the client's temporary key with the next sequential number (001, 002…).
  const orderNumber = pending.body.orderNumber;
  assert.match(orderNumber, /^\d{3,}$/);
  assert.equal(await stockOf(), 2, "stock is only deducted once payment is confirmed");
  const listed = async () => ((await api("GET", "/sales/customer-orders?phone=9876543210", undefined, { auth: false })).body.orders || []).some((o) => (o.orderNumber || o.invoiceNumber || o.order_number) === orderNumber);
  assert.equal(await listed(), false, "an unpaid (pending) order is not in the customer's order history");

  const event = (status, id) => ({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: `RSF_${orderNumber}_A1`, order_tags: { orderNumber } }, payment: { cf_payment_id: id, payment_status: status } } });
  const hook = (body) => api("POST", "/payments/cashfree/webhook", body, { auth: false });

  assert.equal((await hook(event("SUCCESS", "pay-1"))).status, 200);
  assert.equal(await stockOf(), 1, "paid: one piece deducted");
  const dup = await hook(event("SUCCESS", "pay-1"));
  assert.equal(dup.body.deduplicated, true);
  assert.equal(await stockOf(), 1, "a duplicate webhook does not deduct again");
  // A different event for the same order (e.g. verify + webhook) also cannot double-deduct.
  await hook(event("SUCCESS", "pay-2"));
  assert.equal(await stockOf(), 1, "second success event for an already-paid order is a no-op");

  assert.equal(await listed(), true, "once paid, the order appears in the customer's history");
  await hook(event("FAILED", "pay-3"));
  const orders = (await api("GET", "/sales/customer-orders?phone=9876543210", undefined, { auth: false })).body.orders || [];
  assert.ok(orders.length >= 0);
  assert.equal(await stockOf(), 1, "a late failure never un-pays an order");
});

test("webhook signatures are checked on the raw body and fail closed in production", async () => {
  const crypto = await import("node:crypto");
  const { verifyCashfreeWebhookSignature } = await import("../src/services/cashfree.service.js");
  const raw = Buffer.from('{"data":{"order":{"order_id":"X"}}}');
  const ts = "1700000000";
  process.env.CASHFREE_SECRET_KEY = "unit_test_secret";
  try {
    const good = crypto.createHmac("sha256", "unit_test_secret").update(ts + raw.toString()).digest("base64");
    assert.equal(verifyCashfreeWebhookSignature(raw, ts, good), true);
    assert.equal(verifyCashfreeWebhookSignature(raw, ts, good.slice(0, -2) + "xx"), false);
    assert.equal(verifyCashfreeWebhookSignature(raw, ts, undefined), false);
    assert.equal(verifyCashfreeWebhookSignature(Buffer.from("{}"), ts, good), false, "tampered body is rejected");
  } finally {
    delete process.env.CASHFREE_SECRET_KEY;
  }
  const env = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.equal(verifyCashfreeWebhookSignature(raw, ts, "anything"), false, "no secret in production: unsigned webhooks are rejected");
  } finally {
    process.env.NODE_ENV = env;
  }
});

test("Cash on Delivery orders are refused", async () => {
  const r = await api("POST", "/billing/checkout", { customerPhone: "9876543210", paymentMethod: "cod", items: [{ id: "x", name: "x", quantity: 1, price: 1 }], total: 1 }, { auth: false });
  assert.equal(r.status, 400);
  assert.match(r.body.message, /Cash on Delivery is no longer available/);
});

test("cancelling an order restores its stock exactly once and reports the customer's phone", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 2, sku: "" }] }))).body.product;
  const stockOf = async () => (await api("GET", "/catalog/products")).body.products.find((p) => p.id === created.id).stock;
  const line = { id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 };

  const sale = await api("POST", "/billing/checkout", { customerPhone: "9876543210", customerName: "Cancel Tester", items: [line], total: 1000, paymentMethod: "cash", invoiceNumber: `CXL-${Date.now()}` }, { auth: false });
  assert.equal(sale.status, 201, JSON.stringify(sale.body));
  const inv = sale.body.invoiceNumber;
  assert.equal(await stockOf(), 1, "sold: stock 2 -> 1");

  assert.equal((await api("POST", `/sales/${inv}/cancel`, {}, { auth: false })).status, 401, "admin only");

  const cancelled = await api("POST", `/sales/${inv}/cancel`, { reason: "Customer request" });
  assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
  assert.equal(cancelled.body.order.phone, "9876543210");
  assert.equal(cancelled.body.order.customerName, "Cancel Tester");
  assert.equal(await stockOf(), 2, "stock restored by the ordered quantity");

  const again = await api("POST", `/sales/${inv}/cancel`, {});
  assert.equal(again.status, 409);
  assert.equal(again.body.code, "ALREADY_CANCELLED");
  assert.equal(await stockOf(), 2, "a second cancel never restores stock again");

  // Choosing "Cancelled" in the status list of an already-cancelled order is also a no-op for stock.
  await api("PUT", `/sales/${inv}/fulfillment`, { status: "cancelled" });
  assert.equal(await stockOf(), 2);
});

test("a delivered order cannot be cancelled", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 2, sku: "" }] }))).body.product;
  const line = { id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 };
  const sale = await api("POST", "/billing/checkout", { customerPhone: "9876543210", items: [line], total: 1000, paymentMethod: "cash", invoiceNumber: `DLV-${Date.now()}` }, { auth: false });
  const inv = sale.body.invoiceNumber;
  await api("PUT", `/sales/${inv}/fulfillment`, { status: "delivered" });
  const r = await api("POST", `/sales/${inv}/cancel`, {});
  assert.equal(r.status, 409);
  assert.match(r.body.message, /delivered/i);
});

test("Order Confirmed is accepted and the customer sees the same status", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 2, sku: "" }] }))).body.product;
  const line = { id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 };
  const sale = await api("POST", "/billing/checkout", { customerPhone: "9123456780", items: [line], total: 1000, paymentMethod: "cash", invoiceNumber: `CNF-${Date.now()}` }, { auth: false });
  const inv = sale.body.invoiceNumber;
  const ok = await api("PUT", `/sales/${inv}/fulfillment`, { status: "confirmed" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const mine = (await api("GET", "/sales/customer-orders?phone=9123456780", undefined, { auth: false })).body.orders || [];
  assert.equal(mine.find((o) => (o.invoiceNumber || o.orderNumber) === inv)?.orderStatus, "confirmed");
  const bad = await api("PUT", `/sales/${inv}/fulfillment`, { status: "nonsense" });
  assert.equal(bad.status, 400);
});

test("an admin can delete a sales receipt; it disappears and its stock goes back once", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 3, sku: "" }] }))).body.product;
  const line = { id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 };
  const stockOf = async () => (await api("GET", "/catalog/products")).body.products.find((p) => p.id === created.id).stock;
  const sale = await api("POST", "/billing/checkout", { customerPhone: "9123456781", items: [line], total: 1000, paymentMethod: "cash", invoiceNumber: `DEL-${Date.now()}` }, { auth: false });
  const inv = sale.body.invoiceNumber;
  assert.equal(await stockOf(), 2);
  const mine = async () => ((await api("GET", "/sales/customer-orders?phone=9123456781", undefined, { auth: false })).body.orders || []).some((o) => (o.invoiceNumber || o.orderNumber) === inv);
  assert.equal(await mine(), true);
  const noAuth = await api("DELETE", `/sales/${inv}`, undefined, { auth: false });
  assert.ok([401, 403].includes(noAuth.status), "deleting needs an admin login");
  const del = await api("DELETE", `/sales/${inv}`);
  assert.equal(del.status, 200, JSON.stringify(del.body));
  assert.equal(await mine(), false, "the receipt is gone");
  assert.equal(await stockOf(), 3, "deleting a receipt puts the saree back in stock");
  assert.equal((await api("DELETE", `/sales/${inv}`)).status, 404, "deleting twice reports not found");
  assert.equal(await stockOf(), 3, "a second delete never restores stock again");
});

test("deleting an already-cancelled receipt does not restore stock a second time", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 3, sku: "" }] }))).body.product;
  const line = { id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 };
  const stockOf = async () => (await api("GET", "/catalog/products")).body.products.find((p) => p.id === created.id).stock;
  const sale = await api("POST", "/billing/checkout", { customerPhone: "9123456782", items: [line], total: 1000, paymentMethod: "cash", invoiceNumber: `DC-${Date.now()}` }, { auth: false });
  const inv = sale.body.invoiceNumber;
  assert.equal(await stockOf(), 2);
  assert.equal((await api("POST", `/sales/${inv}/cancel`, {})).status, 200);
  assert.equal(await stockOf(), 3, "cancel put it back");
  assert.equal((await api("DELETE", `/sales/${inv}`)).status, 200);
  assert.equal(await stockOf(), 3, "delete after cancel does not add it again");
});

test("a counter sale keeps the address typed at the counter (sent inside `customer`)", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 2, sku: "" }] }))).body.product;
  const line = { id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 };
  const sale = await api("POST", "/billing/checkout", {
    customerPhone: "9123456783", customerName: "Addr Test", items: [line], total: 1000, paymentMethod: "cash",
    invoiceNumber: `ADR-${Date.now()}`, customer: { name: "Addr Test", phone: "9123456783", address: "12-3-45 Test Street, Gadwal" },
  }, { auth: false });
  const inv = sale.body.invoiceNumber;
  const mine = (await api("GET", "/sales/customer-orders?phone=9123456783", undefined, { auth: false })).body.orders || [];
  const order = mine.find((o) => (o.invoiceNumber || o.orderNumber) === inv);
  assert.ok(order, "order found");
  assert.match(JSON.stringify(order.shippingAddress || order.shipping_address || ""), /12-3-45 Test Street/);
});

test("an admin can add the missing address to an older receipt", async () => {
  const created = (await api("POST", "/catalog", product({ variants: [{ color: "Red", colorSlug: "RED", stock: 2, sku: "" }] }))).body.product;
  const line = { id: created.id, productId: created.id, name: "Test Saree", color: "Red", quantity: 1, qty: 1, price: 1000 };
  const sale = await api("POST", "/billing/checkout", { customerPhone: "9123456784", customerName: "Old Sale", items: [line], total: 1000, paymentMethod: "cash", invoiceNumber: `OLD-${Date.now()}` }, { auth: false });
  const inv = sale.body.invoiceNumber;
  const addrOf = async () => {
    const orders = (await api("GET", "/sales/customer-orders?phone=9123456784", undefined, { auth: false })).body.orders || [];
    const o = orders.find((x) => (x.invoiceNumber || x.orderNumber) === inv);
    return JSON.stringify(o?.shippingAddress || o?.shipping_address || "");
  };
  assert.doesNotMatch(await addrOf(), /Lakshmi/);
  assert.ok([401, 403].includes((await api("PUT", `/sales/${inv}/address`, { address: "x" }, { auth: false })).status), "needs an admin login");
  assert.equal((await api("PUT", `/sales/${inv}/address`, { address: "  " })).status, 400);
  const ok = await api("PUT", `/sales/${inv}/address`, { address: "9-1-2 Lakshmi Nagar, Gadwal 509125" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.match(await addrOf(), /Lakshmi Nagar/);
  assert.equal((await api("PUT", "/sales/NOPE-404/address", { address: "x" })).status, 404);
});

// ------------------------------------------------------------------------------------------
// Exhaustion (must run last: it consumes the top of the range)
// ------------------------------------------------------------------------------------------
test("bulk intake: per-row special_offer tag is saved only for the rows that enabled it", async () => {
  const r = await api("POST", "/inventory/bulk-intake", {
    products: [
      { clientRef: "so-on", ...product({ tags: ["bulk-restock", "special_offer"], isSpecialOffer: true }) },
      { clientRef: "so-off", ...product({ tags: ["bulk-restock"] }) },
    ],
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const all = (await api("GET", "/catalog/products")).body.products;
  const on = all.find((p) => p.id === r.body.inserted.find((x) => x.clientRef === "so-on").id);
  const off = all.find((p) => p.id === r.body.inserted.find((x) => x.clientRef === "so-off").id);
  assert.equal(on.isSpecialOffer, true);
  assert.equal(off.isSpecialOffer, false);
});


test("the RS9999 limit is reported instead of generating an invalid SKU", async () => {
  const top = await api("POST", "/catalog", product({ sku: "RS9999" }));
  assert.equal(top.status, 201, JSON.stringify(top.body));
  const r = await api("POST", "/catalog", product());
  assert.equal(r.status, 409, JSON.stringify(r.body));
  assert.match(r.body.message, /SKU range exhausted/);
  const all = (await api("GET", "/catalog/products")).body.products;
  assert.ok(all.every((p) => p.id.startsWith("RSF-") || sku.isValidSku(p.id)), "no invalid SKU was stored");
});


test("create-order accepts the storefront's phone/email fields and rejects a missing phone", async () => {
  const ok = await api("POST", "/payments/cashfree/create-order", { amount: 222, customerName: "T", email: "t@example.com", phone: "+91 9876543210", orderNumber: "RSF-PHONE-TEST-A" }, { auth: false });
  assert.notEqual(ok.status, 400, JSON.stringify(ok.body));
  const missing = await api("POST", "/payments/cashfree/create-order", { amount: 222, customerName: "T", orderNumber: "RSF-PHONE-TEST-B" }, { auth: false });
  assert.equal(missing.status, 400);
});
