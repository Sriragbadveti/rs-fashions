/**
 * Festival offer, storefront side. The rules live on the server (backend/src/services/festivalOffer.js)
 * and come from GET /billing/festival-offer; this file applies the same rules to the cart so the
 * discount shows instantly. The server re-checks it when the order is created.
 *
 *   Buy 1 → ₹100 · 2 → ₹250 · 3 → ₹350 · 4 → ₹450 · 5 → ₹750 · 10 → ₹1,500 off (highest tier reached)
 *   Only sarees priced ABOVE ₹2,900 that are NOT in the Special Offer section count.
 */
import { isSpecialOfferProduct } from "./specialOffer.ts";

export interface FestivalTier {
  qty: number;
  discount: number;
}

export interface FestivalOfferConfig {
  name: string;
  enabled: boolean;
  /** Switched on AND inside its optional date window. */
  active: boolean;
  minPriceExclusive: number;
  tiers: FestivalTier[];
  startsAt: string | null;
  endsAt: string | null;
}

export interface FestivalOfferResult {
  active: boolean;
  name: string;
  eligibleCount: number;
  discount: number;
  /** Next tier the customer can reach, or null at the top tier / when inactive. */
  nextTier: { qty: number; discount: number; moreNeeded: number } | null;
}

interface CartLine {
  product: { price: number; isSpecialOffer?: boolean; isSpecialEdition?: boolean; isLimitedEdition?: boolean; tags?: string[] };
  quantity: number;
}

export const NO_FESTIVAL_OFFER: FestivalOfferResult = { active: false, name: "", eligibleCount: 0, discount: 0, nextTier: null };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Same "Special Offer section" test as the server (it also counts the plain "offers" tag). */
function inSpecialOfferSection(product: CartLine["product"]): boolean {
  if (isSpecialOfferProduct(product)) return true;
  return (Array.isArray(product.tags) ? product.tags : []).some((t) => String(t).trim().toLowerCase() === "offers");
}

export function isFestivalEligible(product: CartLine["product"], config: FestivalOfferConfig | null): boolean {
  if (!config) return false;
  return Number(product.price) > config.minPriceExclusive && !inSpecialOfferSection(product);
}

export function computeFestivalOffer(items: CartLine[], config: FestivalOfferConfig | null): FestivalOfferResult {
  if (!config?.active || !Array.isArray(config.tiers) || config.tiers.length === 0) return NO_FESTIVAL_OFFER;
  const tiers = [...config.tiers].sort((a, b) => a.qty - b.qty);

  let eligibleCount = 0;
  let eligibleSubtotal = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity)) || 0);
    if (qty > 0 && isFestivalEligible(item.product, config)) {
      eligibleCount += qty;
      eligibleSubtotal += Number(item.product.price) * qty;
    }
  }

  let best: FestivalTier | null = null;
  for (const t of tiers) if (eligibleCount >= t.qty) best = t;
  const discount = best ? Math.min(best.discount, Math.round(eligibleSubtotal)) : 0;
  const next = tiers.find((t) => t.qty > eligibleCount) || null;

  return {
    active: true,
    name: config.name,
    eligibleCount,
    discount,
    nextTier: next ? { qty: next.qty, discount: next.discount, moreNeeded: next.qty - eligibleCount } : null,
  };
}

/** One line for the header marquee, e.g. "Festival Offer: Buy 1 get ₹100 off · … on sarees above ₹2,900". */
export function festivalMarqueeText(config: FestivalOfferConfig): string {
  const tiers = [...config.tiers].sort((a, b) => a.qty - b.qty);
  const parts = tiers.map((t) => `Buy ${t.qty} get ${inr(t.discount)} off`);
  return `${config.name}: ${parts.join(" · ")} on sarees above ${inr(config.minPriceExclusive)}`;
}

/** Short cart hint, e.g. "Add 1 more saree above ₹2,900 to get ₹250 off". */
export function festivalNextTierHint(result: FestivalOfferResult, config: FestivalOfferConfig | null): string | null {
  if (!result.active || !result.nextTier || !config) return null;
  const { moreNeeded, discount } = result.nextTier;
  return `Add ${moreNeeded} more saree${moreNeeded > 1 ? "s" : ""} above ${inr(config.minPriceExclusive)} to get ${inr(discount)} off`;
}
