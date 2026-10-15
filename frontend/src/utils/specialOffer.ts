/** Special Offer pricing: every saree with the Special Offer setting costs this much, flat. */
export const SPECIAL_OFFER_PRICE = 2500;

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

/** Special Offer sarees live only on the Special Offers page: every other listing leaves them out. */
export function withoutSpecialOffers<T extends OfferFlags>(list: T[] | null | undefined): T[] {
  return (list || []).filter((p) => !isSpecialOfferProduct(p));
}

/** The sarees the admin put under Special Offers (shown only on the Special Offers page). */
export function onlySpecialOffers<T extends OfferFlags>(list: T[] | null | undefined): T[] {
  return (list || []).filter((p) => isSpecialOfferProduct(p));
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
  return count > 0 ? count * SPECIAL_OFFER_PRICE : 0;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function computeBundleOffer(count: number, regularSubtotal: number): BundleOffer {
  const offerTotal = bundleTotalFor(count);
  const discount = count > 0 ? Math.max(0, Math.round(regularSubtotal - offerTotal)) : 0;
  const message =
    count === 0
      ? `Special Offer: any saree just ${inr(SPECIAL_OFFER_PRICE)}`
      : `Special Offer applied: ${count} saree${count > 1 ? "s" : ""} for ${inr(offerTotal)}`;
  return { count, offerTotal, discount, moreNeeded: 0, nextTotal: offerTotal, message };
}
