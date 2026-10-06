/** Festival offer: tiers, eligibility (> ₹2,900, not Special Offer), switched off by default. */
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.SUPABASE_ANON_KEY = "";
process.env.NODE_ENV = "test";

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Isolated local product store so the HTTP test does not depend on (or touch) the repo's data files.
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "rsf-festival-"));
process.env.RS_LOCAL_DATA_DIR = DATA_DIR;
const STORE_PRODUCTS = [
  { id: "fest-a", name: "Eligible", price: 4500, tags: ["handloom"] },
  { id: "fest-b", name: "Cheap", price: 2900, tags: ["handloom"] },
  { id: "fest-c", name: "Special", price: 6000, tags: ["special_offer"] },
];
fs.writeFileSync(path.join(DATA_DIR, "products.json"), JSON.stringify(STORE_PRODUCTS));

const mod = await import("../src/services/festivalOffer.js");
const {
  DEFAULT_FESTIVAL_OFFER,
  computeFestivalOffer,
  festivalDiscountForCount,
  isFestivalEligible,
  isFestivalOfferActive,
  isSpecialOfferProduct,
  normalizeFestivalOfferConfig,
} = mod;

const ON = { enabled: true };
const saree = (price, extra = {}) => ({ id: `p-${price}-${Math.random()}`, price, tags: ["handloom"], ...extra });
const cart = (...lines) => lines.map(([product, quantity = 1]) => ({ product, quantity }));

test("switched off by default, so nothing is discounted", () => {
  assert.equal(DEFAULT_FESTIVAL_OFFER.enabled, false);
  assert.equal(isFestivalOfferActive(undefined), false);
  assert.equal(isFestivalOfferActive({}), false);
  const r = computeFestivalOffer(cart([saree(5000), 3]), undefined);
  assert.equal(r.active, false);
  assert.equal(r.discount, 0);
  assert.equal(r.eligibleCount, 3); // still counted, so it can be previewed
  assert.equal(computeFestivalOffer(cart([saree(5000), 3]), undefined, { ignoreSchedule: true }).discount, 350);
});

test("tiers exactly as written: 1→100, 2→250, 3→350, 4→450, 5→750, 10→1500", () => {
  const expected = { 0: 0, 1: 100, 2: 250, 3: 350, 4: 450, 5: 750, 6: 750, 7: 750, 8: 750, 9: 750, 10: 1500, 11: 1500, 25: 1500 };
  for (const [n, d] of Object.entries(expected)) {
    assert.equal(festivalDiscountForCount(Number(n), ON), d, `buy ${n}`);
    assert.equal(computeFestivalOffer(cart([saree(3500), Number(n)]), ON).discount, d, `cart of ${n}`);
  }
});

test("only sarees priced above ₹2,900 qualify (₹2,900 itself does not)", () => {
  assert.equal(isFestivalEligible(saree(2900)), false);
  assert.equal(isFestivalEligible(saree(2900.5)), true);
  assert.equal(isFestivalEligible(saree(2901)), true);
  assert.equal(isFestivalEligible(saree(1500)), false);
  assert.equal(isFestivalEligible({ salePrice: 4000 }), true);
  assert.equal(isFestivalEligible({ sale_price: "4000" }), true);
  assert.equal(isFestivalEligible({ price: "abc" }), false);
  assert.equal(isFestivalEligible(null), false);
});

test("Special Offer sarees never qualify, however they are marked", () => {
  for (const extra of [
    { tags: ["special_offer"] }, { tags: ["Offers"] }, { tags: [" special_edition "] }, { tags: ["limited_edition"] },
    { isSpecialOffer: true }, { is_special_offer: true }, { isSpecialEdition: true }, { isLimitedEdition: true },
  ]) {
    const p = saree(6000, extra);
    assert.equal(isSpecialOfferProduct(p), true, JSON.stringify(extra));
    assert.equal(isFestivalEligible(p), false, JSON.stringify(extra));
  }
  assert.equal(isSpecialOfferProduct(saree(6000, { tags: ["trending", "handloom"] })), false);
  assert.equal(isSpecialOfferProduct(saree(6000, { tags: "special_offer" })), false); // malformed tags ignored
});

test("mixed cart: only eligible sarees count towards the tier", () => {
  const r = computeFestivalOffer(
    cart([saree(3200), 2], [saree(2900), 1], [saree(2500), 4], [saree(8000, { tags: ["special_offer"] }), 2], [saree(4100), 1]),
    ON
  );
  assert.equal(r.eligibleCount, 3);
  assert.equal(r.eligibleSubtotal, 3200 * 2 + 4100);
  assert.equal(r.discount, 350);
  assert.deepEqual(r.nextTier, { qty: 4, discount: 450, moreNeeded: 1 });
  assert.deepEqual(r.lines.map((l) => l.reason), [null, "price_not_above_minimum", "price_not_above_minimum", "special_offer", null]);
});

test("bad cart input never throws and never gives a discount", () => {
  for (const bad of [undefined, null, "x", 5, {}, [null], [{}], [{ product: saree(5000), quantity: 0 }], [{ product: saree(5000), quantity: -3 }], [{ product: saree(5000), quantity: "abc" }]]) {
    const r = computeFestivalOffer(bad, ON);
    assert.equal(r.discount, 0, JSON.stringify(bad));
    assert.equal(r.eligibleCount, 0);
  }
  // missing quantity means one piece; fractional quantities are floored
  assert.equal(computeFestivalOffer([{ product: saree(5000) }], ON).discount, 100);
  assert.equal(computeFestivalOffer([{ product: saree(5000), quantity: 2.9 }], ON).discount, 250);
  assert.equal(computeFestivalOffer([{ product: saree(5000), quantity: "3" }], ON).discount, 350);
});

test("discount can never exceed what the eligible sarees cost", () => {
  const r = computeFestivalOffer(cart([saree(50), 10]), { enabled: true, minPriceExclusive: 0 });
  assert.equal(r.discount, 500);
});

test("date window: inactive before start and after end", () => {
  const c = { enabled: true, startsAt: "2026-10-15T00:00:00+05:30", endsAt: "2026-11-05T23:59:59+05:30" };
  assert.equal(isFestivalOfferActive(c, new Date("2026-10-14T12:00:00+05:30")), false);
  assert.equal(isFestivalOfferActive(c, new Date("2026-10-20T12:00:00+05:30")), true);
  assert.equal(isFestivalOfferActive(c, new Date("2026-11-06T00:00:01+05:30")), false);
  assert.equal(isFestivalOfferActive({ enabled: true, startsAt: "not a date" }), true); // bad dates ignored
});

test("stored config is cleaned up: partial, malformed or hostile values fall back safely", () => {
  assert.deepEqual(normalizeFestivalOfferConfig(null).tiers, DEFAULT_FESTIVAL_OFFER.tiers.map((t) => ({ ...t })));
  assert.equal(normalizeFestivalOfferConfig({ enabled: "true" }).enabled, false); // only a real true switches it on
  assert.equal(normalizeFestivalOfferConfig({ enabled: true }).minPriceExclusive, 2900);
  assert.equal(normalizeFestivalOfferConfig({ minPriceExclusive: -5 }).minPriceExclusive, 2900);
  assert.equal(normalizeFestivalOfferConfig({ minPriceExclusive: "3500" }).minPriceExclusive, 3500);
  const c = normalizeFestivalOfferConfig({ tiers: [{ qty: 3, discount: 300 }, { qty: 0, discount: 50 }, { qty: 1, discount: -1 }, null, { qty: 1, discount: "90" }] });
  assert.deepEqual(c.tiers, [{ qty: 1, discount: 90 }, { qty: 3, discount: 300 }]);
  assert.deepEqual(normalizeFestivalOfferConfig({ tiers: [] }).tiers.length, 6);
  // defaults are frozen, so normalising can never mutate them
  normalizeFestivalOfferConfig(null).tiers[0].discount = 9999;
  assert.equal(DEFAULT_FESTIVAL_OFFER.tiers[0].discount, 100);
});

test("HTTP: public quote is ₹0 while off, admin preview shows the real amount, stored prices win", async () => {
  const express = (await import("express")).default;
  const billingRoutes = (await import("../src/routes/billing.routes.js")).default;
  const { generateAdminToken } = await import("../src/middleware/adminAuth.js");

  const app = express();
  app.use(express.json());
  app.use("/api/billing", billingRoutes);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/billing/festival-offer`;
  const post = (url, body, headers = {}) =>
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json() }));

  try {
    // client-sent price is ignored: the stored product is used
    const items = [
      { productId: "fest-a", quantity: 2, price: 1, tags: ["special_offer"] },
      { id: "fest-b", quantity: 3, price: 99999 },
      { product: { id: "fest-c", tags: [] }, quantity: 4 },
      { productId: "does-not-exist", quantity: 5 },
    ];
    const pub = await post(`${base}/quote`, { items });
    assert.equal(pub.status, 200);
    assert.equal(pub.body.data.offer.discount, 0);
    assert.equal(pub.body.data.offer.eligibleCount, 2);
    assert.equal(pub.body.data.config.active, false);

    assert.equal((await post(`${base}/preview`, { items })).status, 401);

    const { token } = generateAdminToken({ username: "test" });
    const prev = await post(`${base}/preview`, { items }, { Authorization: `Bearer ${token}` });
    assert.equal(prev.status, 200);
    assert.equal(prev.body.data.offer.discount, 250);
    assert.equal(prev.body.data.config.active, false);

    const empty = await post(`${base}/quote`, {});
    assert.equal(empty.status, 200);
    assert.equal(empty.body.data.offer.discount, 0);
    const big = await post(`${base}/preview`, { items: [{ productId: "fest-a", quantity: 1e9 }] }, { Authorization: `Bearer ${token}` });
    assert.equal(big.body.data.offer.eligibleCount, 100); // quantities are capped
    assert.equal(big.body.data.offer.discount, 1500);
  } finally {
    server.close();
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  }
});
