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
// Exhaustion (runs last among SKU tests: it consumes the top of the range)
// ------------------------------------------------------------------------------------------
test("the RS9999 limit is reported instead of generating an invalid SKU", async () => {
  const top = await api("POST", "/catalog", product({ sku: "RS9999" }));
  assert.equal(top.status, 201, JSON.stringify(top.body));
  const r = await api("POST", "/catalog", product());
  assert.equal(r.status, 409, JSON.stringify(r.body));
  assert.match(r.body.message, /SKU range exhausted/);
  const all = (await api("GET", "/catalog/products")).body.products;
  assert.ok(all.every((p) => p.id.startsWith("RSF-") || sku.isValidSku(p.id)), "no invalid SKU was stored");
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
