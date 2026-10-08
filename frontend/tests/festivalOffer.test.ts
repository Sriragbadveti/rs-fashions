import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFestivalOffer, festivalMarqueeText, festivalNextTierHint, type FestivalOfferConfig } from "../src/utils/festivalOffer.ts";

const config: FestivalOfferConfig = {
  name: "Festival Offer",
  enabled: true,
  active: true,
  minPriceExclusive: 2900,
  tiers: [
    { qty: 1, discount: 100 },
    { qty: 2, discount: 250 },
    { qty: 3, discount: 350 },
    { qty: 4, discount: 450 },
    { qty: 5, discount: 750 },
    { qty: 10, discount: 1500 },
  ],
  startsAt: null,
  endsAt: null,
};
const saree = (price: number, extra = {}) => ({ product: { price, ...extra }, quantity: 1 });

test("tiers: highest tier reached (1=100 … 5-9=750, 10+=1500)", () => {
  const off = (n: number) => computeFestivalOffer([{ product: { price: 3000 }, quantity: n }], config).discount;
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 9, 10, 15].map(off), [0, 100, 250, 350, 450, 750, 750, 750, 1500, 1500]);
});

test("only sarees ABOVE ₹2,900 and outside the Special Offer section count", () => {
  const r = computeFestivalOffer(
    [saree(2900), saree(2901), saree(3500, { isSpecialOffer: true }), saree(4000, { tags: ["offers"] }), saree(5000)],
    config
  );
  assert.equal(r.eligibleCount, 2);
  assert.equal(r.discount, 250);
});

test("switched off (or not loaded) means no discount", () => {
  assert.equal(computeFestivalOffer([saree(5000)], { ...config, active: false }).discount, 0);
  assert.equal(computeFestivalOffer([saree(5000)], null).discount, 0);
});

test("marquee and next-tier hint read naturally", () => {
  assert.match(festivalMarqueeText(config), /^Festival Offer: Buy 1 get ₹100 off · Buy 2 get ₹250 off .* on sarees above ₹2,900$/);
  const r = computeFestivalOffer([saree(3000)], config);
  assert.equal(festivalNextTierHint(r, config), "Add 1 more saree above ₹2,900 to get ₹250 off");
});
