/**
 * Special Offer bundle pricing. Only sarees with the Special Offer setting enabled qualify.
 *   Buy 1 @ ₹2,500 · Buy 2 @ ₹4,900 · Buy 3 @ ₹4,800 (bundle totals).
 * More than three: each full group of three costs ₹4,800, the remainder uses the 1/2 price.
 */
export const OFFER_BUNDLE_PRICES: Record<1 | 2 | 3, number> = { 1: 2500, 2: 4900, 3: 4800 };

interface OfferFlags {
  isSpecialOffer?: boolean;
  isSpecialEdition?: boolean;
  isLimitedEdition?: boolean;
  tags?: string[];
}

/** True when the product is enabled for the bundle offers (legacy Special/Limited Edition included). */
export function isSpecialOfferProduct(p: OfferFlags | null | undefined): boolean {
  if (!p) return false;
  if (p.isSpecialOffer || p.isSpecialEdition || p.isLimitedEdition) return true;
  const tags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).toLowerCase()) : [];
  return tags.some((t) => t === "special_offer" || t === "special_edition" || t === "limited_edition");
}

export interface BundleOffer {
  count: number;
  /** Price the eligible sarees cost together under the offer. */
  offerTotal: number;
  /** Amount taken off the eligible sarees' regular total (never negative). */
  discount: number;
  /** Sarees to add to reach the next better bundle (0 when already on a full group of 3). */
  moreNeeded: number;
  /** Bundle total after adding `moreNeeded`. */
  nextTotal: number;
  message: string;
}

export function bundleTotalFor(count: number): number {
  if (count <= 0) return 0;
  const groups = Math.floor(count / 3);
  const rest = count % 3;
  return groups * OFFER_BUNDLE_PRICES[3] + (rest ? OFFER_BUNDLE_PRICES[rest as 1 | 2] : 0);
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function computeBundleOffer(count: number, regularSubtotal: number): BundleOffer {
  const offerTotal = bundleTotalFor(count);
  const discount = count > 0 ? Math.max(0, Math.round(regularSubtotal - offerTotal)) : 0;
  const rest = count % 3;
  const moreNeeded = count === 0 ? 0 : rest === 0 ? 0 : 3 - rest;
  const nextTotal = bundleTotalFor(count + moreNeeded);
  let message: string;
  if (count === 0) {
    message = `Special Offer sarees: Buy 1 @ ${inr(2500)} · Buy 2 @ ${inr(4900)} · Buy 3 @ ${inr(4800)}`;
  } else if (moreNeeded > 0) {
    message = `Add ${moreNeeded} more Special Offer saree${moreNeeded > 1 ? "s" : ""} to get ${count + moreNeeded} for just ${inr(nextTotal)}`;
  } else {
    message = `Special Offer applied: ${count} sarees for ${inr(offerTotal)}`;
  }
  return { count, offerTotal, discount, moreNeeded, nextTotal, message };
}
