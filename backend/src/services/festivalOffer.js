import { supabase } from "../config/supabase.js";
import { getProductsFromStore } from "../database/localStore.js";

/**
 * Festival offer: a flat amount off the order, based on how many eligible sarees are bought.
 *   Buy 1 → ₹100 · Buy 2 → ₹250 · Buy 3 → ₹350 · Buy 4 → ₹450 · Buy 5 → ₹750 · Buy 10 → ₹1,500
 * The highest tier reached applies (6–9 sarees → ₹750, 10 or more → ₹1,500).
 *
 * Eligible: sarees priced ABOVE ₹2,900 that are NOT in the Special Offer section
 * (Special Offer sarees already get their own bundle price).
 *
 * Switched OFF by default. It is stored in the `festival_offer` setting and turned on with
 *   PUT /api/admin/settings/festival_offer  { "value": { "enabled": true } }
 * The storefront does not use it yet, so nothing changes for customers until it is wired in.
 */

export const FESTIVAL_OFFER_SETTING_KEY = "festival_offer";

export const DEFAULT_FESTIVAL_OFFER = Object.freeze({
  enabled: false,
  name: "Festival Offer",
  /** A saree must cost strictly more than this to qualify. */
  minPriceExclusive: 2900,
  tiers: Object.freeze([
    Object.freeze({ qty: 1, discount: 100 }),
    Object.freeze({ qty: 2, discount: 250 }),
    Object.freeze({ qty: 3, discount: 350 }),
    Object.freeze({ qty: 4, discount: 450 }),
    Object.freeze({ qty: 5, discount: 750 }),
    Object.freeze({ qty: 10, discount: 1500 }),
  ]),
  /** Optional ISO dates; when set, the offer only runs inside this window. */
  startsAt: null,
  endsAt: null,
});

// Same markers the catalog, bootstrap and storefront use for the Special Offer section.
const SPECIAL_OFFER_TAGS = new Set(["special_offer", "offers", "special_edition", "limited_edition"]);

/** True when the product belongs to the Special Offer section (so it is NOT festival-eligible). */
export function isSpecialOfferProduct(p) {
  if (!p || typeof p !== "object") return false;
  if (
    p.isSpecialOffer || p.is_special_offer ||
    p.isSpecialEdition || p.is_special_edition ||
    p.isLimitedEdition || p.is_limited_edition
  ) return true;
  const tags = Array.isArray(p.tags) ? p.tags : [];
  return tags.some((t) => SPECIAL_OFFER_TAGS.has(String(t).trim().toLowerCase()));
}

function toAmount(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toDate(v) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Merges a stored (possibly partial or malformed) config over the defaults.
 * Bad tiers are dropped; if none survive the default tiers are used.
 */
export function normalizeFestivalOfferConfig(raw) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const tiersByQty = new Map();
  if (Array.isArray(src.tiers)) {
    for (const t of src.tiers) {
      const qty = Math.floor(Number(t?.qty));
      const discount = Math.round(toAmount(t?.discount));
      if (Number.isFinite(qty) && qty >= 1 && discount > 0) tiersByQty.set(qty, discount);
    }
  }
  const tiers = tiersByQty.size > 0
    ? [...tiersByQty].map(([qty, discount]) => ({ qty, discount })).sort((a, b) => a.qty - b.qty)
    : DEFAULT_FESTIVAL_OFFER.tiers.map((t) => ({ ...t }));

  const minPrice = Number(src.minPriceExclusive);
  return {
    enabled: src.enabled === true,
    name: typeof src.name === "string" && src.name.trim() ? src.name.trim().slice(0, 80) : DEFAULT_FESTIVAL_OFFER.name,
    minPriceExclusive: Number.isFinite(minPrice) && minPrice >= 0 ? minPrice : DEFAULT_FESTIVAL_OFFER.minPriceExclusive,
    tiers,
    startsAt: toDate(src.startsAt),
    endsAt: toDate(src.endsAt),
  };
}

/** True when the offer is switched on and today is inside its (optional) date window. */
export function isFestivalOfferActive(config, now = new Date()) {
  const c = normalizeFestivalOfferConfig(config);
  if (!c.enabled) return false;
  const t = now.getTime();
  if (c.startsAt && t < new Date(c.startsAt).getTime()) return false;
  if (c.endsAt && t > new Date(c.endsAt).getTime()) return false;
  return true;
}

/** Selling price of a product row / cart product, whichever field it uses. */
export function sellingPrice(p) {
  if (!p || typeof p !== "object") return 0;
  return toAmount(p.price ?? p.salePrice ?? p.sale_price);
}

export function isFestivalEligible(product, config = DEFAULT_FESTIVAL_OFFER) {
  const c = normalizeFestivalOfferConfig(config);
  return sellingPrice(product) > c.minPriceExclusive && !isSpecialOfferProduct(product);
}

/** Flat discount for `count` eligible sarees: the highest tier reached (0 below the first tier). */
export function festivalDiscountForCount(count, config = DEFAULT_FESTIVAL_OFFER) {
  const c = normalizeFestivalOfferConfig(config);
  const n = Math.floor(Number(count)) || 0;
  let best = null;
  for (const tier of c.tiers) if (n >= tier.qty) best = tier;
  return best ? best.discount : 0;
}

/**
 * Works out the festival offer for a cart.
 * @param items  [{ product, quantity }] — product needs price + tags/flags (server-trusted data).
 * @param config stored festival_offer setting (normalised here).
 * @param opts   { ignoreSchedule: true } to preview while the offer is switched off.
 * Never throws; never returns more discount than the eligible sarees cost.
 */
export function computeFestivalOffer(items, config, { ignoreSchedule = false, now = new Date() } = {}) {
  const c = normalizeFestivalOfferConfig(config);
  const active = ignoreSchedule || isFestivalOfferActive(c, now);

  let eligibleCount = 0;
  let eligibleSubtotal = 0;
  const lines = [];
  for (const item of Array.isArray(items) ? items : []) {
    const product = item?.product;
    const quantity = Math.max(0, Math.floor(Number(item?.quantity ?? 1)) || 0);
    if (!product || quantity === 0) continue;
    const price = sellingPrice(product);
    const special = isSpecialOfferProduct(product);
    const eligible = price > c.minPriceExclusive && !special;
    if (eligible) {
      eligibleCount += quantity;
      eligibleSubtotal += price * quantity;
    }
    lines.push({
      productId: product.id ?? null,
      quantity,
      price,
      eligible,
      reason: eligible ? null : special ? "special_offer" : "price_not_above_minimum",
    });
  }

  const tierDiscount = festivalDiscountForCount(eligibleCount, c);
  const discount = active ? Math.min(tierDiscount, Math.round(eligibleSubtotal)) : 0;
  const nextTier = c.tiers.find((t) => t.qty > eligibleCount) || null;

  return {
    name: c.name,
    active,
    eligibleCount,
    eligibleSubtotal: Math.round(eligibleSubtotal),
    discount,
    nextTier: nextTier ? { qty: nextTier.qty, discount: nextTier.discount, moreNeeded: nextTier.qty - eligibleCount } : null,
    lines,
  };
}

// The setting rarely changes; a short cache keeps quotes from hitting the database every time.
const CONFIG_TTL_MS = 30 * 1000;
let cachedConfig = null;
let cachedAt = 0;

export function invalidateFestivalOfferCache() {
  cachedConfig = null;
  cachedAt = 0;
}

/** Reads the stored setting. Any failure falls back to the defaults (i.e. switched off). */
export async function loadFestivalOfferConfig() {
  if (cachedConfig && Date.now() - cachedAt < CONFIG_TTL_MS) return cachedConfig;
  let raw = null;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", FESTIVAL_OFFER_SETTING_KEY)
        .maybeSingle();
      if (!error) raw = data?.value ?? null;
      else console.warn("[Festival Offer] Could not read setting:", error.message);
    } catch (err) {
      console.warn("[Festival Offer] Could not read setting:", err.message);
    }
  }
  cachedConfig = normalizeFestivalOfferConfig(raw);
  cachedAt = Date.now();
  return cachedConfig;
}

const MAX_QUOTE_LINES = 100;
const MAX_LINE_QTY = 100;

/**
 * Turns request cart lines ({ productId | id | product.id, quantity | qty }) into
 * [{ product, quantity }] using the STORED product (price and tags are never taken from the client).
 * Unknown products are skipped.
 */
export async function resolveCartProducts(rawItems) {
  const wanted = [];
  for (const item of (Array.isArray(rawItems) ? rawItems : []).slice(0, MAX_QUOTE_LINES)) {
    const id = item?.productId ?? item?.id ?? item?.product?.id;
    if (id === undefined || id === null || String(id).trim() === "") continue;
    const quantity = Math.min(MAX_LINE_QTY, Math.max(1, Math.floor(Number(item?.quantity ?? item?.qty)) || 1));
    wanted.push({ id: String(id).trim(), quantity });
  }
  if (wanted.length === 0) return [];

  const ids = [...new Set(wanted.map((w) => w.id))];
  let rows = [];
  if (supabase) {
    const { data, error } = await supabase.from("products").select("*").in("id", ids);
    if (error) throw new Error(`Could not load products: ${error.message}`);
    rows = data || [];
  } else {
    rows = getProductsFromStore().filter((p) => ids.includes(String(p.id)));
  }
  const byId = new Map(rows.map((r) => [String(r.id), r]));
  return wanted.filter((w) => byId.has(w.id)).map((w) => ({ product: byId.get(w.id), quantity: w.quantity }));
}
