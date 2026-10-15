import { test } from "node:test";
import assert from "node:assert/strict";
import { SPECIAL_OFFER_PRICE, bundleTotalFor, computeBundleOffer, isSpecialOfferProduct } from "../src/utils/specialOffer.ts";

test("flat price: every Special Offer saree costs ₹2,500", () => {
  assert.equal(SPECIAL_OFFER_PRICE, 2500);
  assert.deepEqual([0, 1, 2, 3, 4, 6].map(bundleTotalFor), [0, 2500, 5000, 7500, 10000, 15000]);
});

test("discount is regular subtotal minus the flat total, never negative", () => {
  assert.equal(computeBundleOffer(1, 3000).discount, 500);
  assert.equal(computeBundleOffer(2, 6000).discount, 1000);
  assert.equal(computeBundleOffer(3, 9000).discount, 1500);
  assert.equal(computeBundleOffer(1, 2000).discount, 0, "cheaper than the offer price: no surcharge");
  assert.equal(computeBundleOffer(0, 0).discount, 0);
});

test("cart text states the flat price; there is no 'add more' prompt", () => {
  assert.match(computeBundleOffer(0, 0).message, /any saree just ₹2,500/);
  assert.match(computeBundleOffer(1, 3000).message, /1 saree for ₹2,500/);
  assert.match(computeBundleOffer(3, 9000).message, /3 sarees for ₹7,500/);
  for (const n of [1, 2, 3]) assert.equal(computeBundleOffer(n, n * 3000).moreNeeded, 0);
});

test("only products with the Special Offer setting qualify", () => {
  assert.equal(isSpecialOfferProduct({ tags: ["handloom"] }), false);
  assert.equal(isSpecialOfferProduct({}), false);
  assert.equal(isSpecialOfferProduct({ isSpecialOffer: true }), true);
  assert.equal(isSpecialOfferProduct({ tags: ["special_offer"] }), true);
  assert.equal(isSpecialOfferProduct({ isLimitedEdition: true }), true, "legacy edition products keep their intent");
});
