import { test } from "node:test";
import assert from "node:assert/strict";
import { bundleTotalFor, computeBundleOffer, isSpecialOfferProduct } from "../src/utils/specialOffer.ts";

test("bundle totals: 1=2500, 2=4900, 3=4800, 4=7300, 6=9600", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(bundleTotalFor), [0, 2500, 4900, 4800, 7300, 9700, 9600]);
});

test("discount is regular subtotal minus bundle total, never negative", () => {
  assert.equal(computeBundleOffer(1, 3000).discount, 500);
  assert.equal(computeBundleOffer(2, 6000).discount, 1100);
  assert.equal(computeBundleOffer(3, 9000).discount, 4200);
  assert.equal(computeBundleOffer(1, 2000).discount, 0, "cheaper than the offer price: no surcharge");
  assert.equal(computeBundleOffer(0, 0).discount, 0);
});

test("cart prompts tell the customer how many more to add", () => {
  const one = computeBundleOffer(1, 3000);
  assert.equal(one.moreNeeded, 2);
  assert.match(one.message, /Add 2 more .* to get 3 for just ₹4,800/);
  assert.match(computeBundleOffer(2, 6000).message, /Add 1 more .* to get 3 for just ₹4,800/);
  assert.match(computeBundleOffer(3, 9000).message, /3 sarees for ₹4,800/);
  assert.equal(computeBundleOffer(3, 9000).moreNeeded, 0);
});

test("only products with the Special Offer setting qualify", () => {
  assert.equal(isSpecialOfferProduct({ tags: ["handloom"] }), false);
  assert.equal(isSpecialOfferProduct({}), false);
  assert.equal(isSpecialOfferProduct({ isSpecialOffer: true }), true);
  assert.equal(isSpecialOfferProduct({ tags: ["special_offer"] }), true);
  assert.equal(isSpecialOfferProduct({ isLimitedEdition: true }), true, "legacy edition products keep their intent");
});
