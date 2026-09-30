/**
 * Central SKU service. Every SKU created by the application has the form RS0001–RS9999
 * ("RS" + exactly four digits). The backend is the only place SKUs are allocated.
 *
 * Allocation strategy:
 *  1. If the database has the `allocate_skus` function (see the SKU section of schema.sql),
 *     SKUs are allocated atomically in Postgres and recorded in `sku_registry`, whose primary
 *     key enforces uniqueness for every product and variant SKU across all server instances.
 *  2. Otherwise SKUs are allocated in-process under a mutex from the highest RS number already
 *     used by products, shade variants and the stock-movement history. Product-level SKUs are
 *     still protected by the products primary key (inserts retry on conflict).
 * SKUs are never reused: numbers below the highest one ever used are not handed out again, so
 * a deleted product's SKU can't be confused with a new product in orders or stock history.
 */
import { supabase } from "../config/supabase.js";
import { getProductsFromStore } from "../database/localStore.js";
import { getPersistentVariantsMap } from "./inventory.service.js";

export const SKU_PREFIX = "RS";
export const SKU_DIGITS = 4;
export const SKU_MAX = 9999;
export const SKU_PATTERN = /^RS\d{4}$/;

export class SkuExhaustedError extends Error {
  constructor(requested) {
    super(
      `SKU range exhausted: RS${String(SKU_MAX).padStart(SKU_DIGITS, "0")} has been reached, ` +
        `so ${requested} new SKU(s) cannot be allocated. The SKU format must be extended ` +
        `(for example to five digits) before more products can be created.`
    );
    this.name = "SkuExhaustedError";
    this.statusCode = 409;
  }
}

export class InvalidSkuError extends Error {
  constructor(value) {
    super(`Invalid SKU "${value}". SKUs must be "RS" followed by exactly four digits, e.g. RS0001.`);
    this.name = "InvalidSkuError";
    this.statusCode = 400;
  }
}

export function isValidSku(value) {
  return typeof value === "string" && SKU_PATTERN.test(value) && value !== "RS0000";
}

export function formatSku(number) {
  if (!Number.isInteger(number) || number < 1 || number > SKU_MAX) {
    throw new RangeError(`SKU number out of range: ${number}`);
  }
  return `${SKU_PREFIX}${String(number).padStart(SKU_DIGITS, "0")}`;
}

export function skuNumber(value) {
  return isValidSku(value) ? Number(value.slice(SKU_PREFIX.length)) : 0;
}

// ---------------------------------------------------------------------------------------------
// In-process serialisation (fallback path)
// ---------------------------------------------------------------------------------------------
let allocationChain = Promise.resolve();
// Numbers handed out recently but possibly not yet visible in the database (insert in flight).
const recentlyAllocated = new Map(); // number -> expiresAt
const RESERVATION_TTL_MS = 10 * 60 * 1000;

function withAllocationLock(fn) {
  const run = allocationChain.then(fn, fn);
  allocationChain = run.catch(() => {});
  return run;
}

function highestReservedNumber() {
  const now = Date.now();
  let max = 0;
  for (const [num, expiresAt] of recentlyAllocated) {
    if (expiresAt < now) recentlyAllocated.delete(num);
    else if (num > max) max = num;
  }
  return max;
}

function maxSkuIn(values) {
  let max = 0;
  for (const v of values) {
    const n = skuNumber(v);
    if (n > max) max = n;
  }
  return max;
}

async function highestUsedNumber() {
  let max = highestReservedNumber();

  const variantsMap = await getPersistentVariantsMap();
  for (const [productId, variants] of Object.entries(variantsMap || {})) {
    max = Math.max(max, skuNumber(productId));
    if (Array.isArray(variants)) max = Math.max(max, maxSkuIn(variants.map((v) => v?.sku)));
  }

  if (supabase) {
    // "RS____" matches exactly six characters starting with RS; the regex check filters digits.
    const { data: products, error: prodErr } = await supabase.from("products").select("id").like("id", "RS____");
    if (prodErr) throw prodErr;
    max = Math.max(max, maxSkuIn((products || []).map((p) => p.id)));

    const { data: movements, error: movErr } = await supabase
      .from("stock_movements")
      .select("sku")
      .like("sku", "RS____")
      .order("sku", { ascending: false })
      .limit(50);
    if (movErr) throw movErr;
    max = Math.max(max, maxSkuIn((movements || []).map((m) => m.sku)));
  } else {
    for (const p of getProductsFromStore()) {
      max = Math.max(max, skuNumber(p.id));
      if (Array.isArray(p.variants)) max = Math.max(max, maxSkuIn(p.variants.map((v) => v?.sku)));
    }
  }

  return max;
}

let registryAvailable = null; // null = unknown, true/false after the first attempt

async function allocateViaRegistry(productId, count) {
  if (!supabase || registryAvailable === false) return null;
  const { data, error } = await supabase.rpc("allocate_skus", { p_product_id: productId, p_count: count });
  if (error) {
    const text = `${error.code || ""} ${error.message || ""}`;
    if (/PGRST202|42883|could not find the function|does not exist/i.test(text)) {
      registryAvailable = false;
      console.warn("[SkuService] allocate_skus() not installed; using in-process allocation. Run the SKU migration in schema.sql for database-enforced uniqueness.");
      return null;
    }
    if (/SKU_RANGE_EXHAUSTED/.test(text)) throw new SkuExhaustedError(count);
    throw error;
  }
  registryAvailable = true;
  const skus = Array.isArray(data) ? data : [];
  if (skus.length !== count || !skus.every(isValidSku)) {
    throw new Error("allocate_skus() returned an unexpected result");
  }
  return skus;
}

/**
 * Allocates `count` new, never-used SKUs for `productId` (use a placeholder such as
 * "pending" when the product ID is itself the first SKU; it is only used for the registry).
 */
export async function allocateSkus(count, productId = "pending") {
  if (!Number.isInteger(count) || count < 1) return [];

  const fromRegistry = await allocateViaRegistry(productId, count);
  if (fromRegistry) return fromRegistry;

  return withAllocationLock(async () => {
    const start = (await highestUsedNumber()) + 1;
    const end = start + count - 1;
    if (end > SKU_MAX) throw new SkuExhaustedError(count);
    const skus = [];
    const expiresAt = Date.now() + RESERVATION_TTL_MS;
    for (let n = start; n <= end; n++) {
      recentlyAllocated.set(n, expiresAt);
      skus.push(formatSku(n));
    }
    return skus;
  });
}

/**
 * Records final SKU ownership in the registry once the product row exists (registry mode only).
 * In registry mode `allocate_skus` already inserted the rows under the placeholder owner.
 */
export async function assignSkusToProduct(skus, productId) {
  if (!supabase || registryAvailable !== true || skus.length === 0) return;
  const { error } = await supabase.from("sku_registry").update({ product_id: productId }).in("sku", skus);
  if (error) console.warn("[SkuService] sku_registry ownership update notice:", error.message);
}

/**
 * Returns variants where every variant has a SKU: existing SKUs of this product (including
 * legacy non-RS SKUs of products created before the RS format) are preserved; any variant
 * without a SKU, with an invalid one, or with one that doesn't already belong to this product
 * receives a newly allocated SKU. Duplicate SKUs within the product are rejected.
 *
 * @param variants        incoming variants
 * @param ownedSkus       SKUs the product already owns (empty for a new product)
 * @param productId       product ID for registry ownership
 * @param reserved        SKUs already allocated for this product in this request (e.g. its ID)
 */
export async function ensureVariantSkus(variants, { ownedSkus = [], productId = "pending", reserved = [] } = {}) {
  const list = Array.isArray(variants) ? variants.map((v) => ({ ...v })) : [];
  const owned = new Set(ownedSkus.filter(Boolean));
  const pool = [...reserved];
  const seen = new Set();
  const needsSku = [];

  list.forEach((v, idx) => {
    const sku = typeof v.sku === "string" ? v.sku.trim() : "";
    if (sku && owned.has(sku) && !seen.has(sku)) {
      seen.add(sku);
      v.sku = sku;
      return;
    }
    // Hand out an SKU already reserved for this request before allocating new ones.
    const reservedSku = pool.shift();
    if (reservedSku) {
      seen.add(reservedSku);
      v.sku = reservedSku;
      return;
    }
    needsSku.push(idx);
  });

  if (needsSku.length > 0) {
    const fresh = await allocateSkus(needsSku.length, productId);
    needsSku.forEach((idx, i) => {
      list[idx].sku = fresh[i];
      seen.add(fresh[i]);
    });
  }

  const skus = list.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) {
    const err = new Error("Duplicate SKUs within the same product are not allowed.");
    err.statusCode = 400;
    throw err;
  }
  return list;
}

/**
 * Releases in-process reservations for SKUs whose product was not created (fallback mode), so
 * the same explicit SKU can be retried. Registry allocations are never released: a number that
 * was issued stays burned, which keeps order and stock history unambiguous.
 */
export function releaseSkuReservations(skus = []) {
  for (const value of skus) {
    const n = skuNumber(value);
    if (n) recentlyAllocated.delete(n);
  }
}

/** Normalises a client-supplied SKU (trim + uppercase) or returns "" when none was supplied. */
export function normalizeRequestedSku(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim().toUpperCase();
}

async function isSkuInUse(sku) {
  const variantsMap = await getPersistentVariantsMap();
  for (const [productId, variants] of Object.entries(variantsMap || {})) {
    if (productId === sku) return true;
    if (Array.isArray(variants) && variants.some((v) => v?.sku === sku)) return true;
  }
  if (supabase) {
    const [{ data: prod }, { data: mov }] = await Promise.all([
      supabase.from("products").select("id").eq("id", sku).maybeSingle(),
      supabase.from("stock_movements").select("id").eq("sku", sku).limit(1),
    ]);
    return Boolean(prod) || (Array.isArray(mov) && mov.length > 0);
  }
  return getProductsFromStore().some(
    (p) => p.id === sku || (Array.isArray(p.variants) && p.variants.some((v) => v?.sku === sku))
  );
}

/**
 * Claims an explicitly requested SKU for a new product. Throws 409 when it is already used by
 * any product, shade variant or stock history (or registered in sku_registry).
 */
export async function claimRequestedSku(sku, productId) {
  if (!isValidSku(sku)) throw new InvalidSkuError(sku);

  if (supabase && registryAvailable !== false) {
    const { error } = await supabase.from("sku_registry").insert({ sku, product_id: productId });
    if (!error) {
      registryAvailable = true;
      return;
    }
    if (error.code === "23505") {
      const err = new Error(`SKU ${sku} is already assigned to another product.`);
      err.statusCode = 409;
      throw err;
    }
    // Registry table not installed: fall through to the in-process check.
    if (!/42P01|PGRST205|does not exist|Could not find the table/i.test(`${error.code} ${error.message}`)) throw error;
  }

  await withAllocationLock(async () => {
    const reservedUntil = recentlyAllocated.get(skuNumber(sku));
    if ((reservedUntil && reservedUntil > Date.now()) || (await isSkuInUse(sku))) {
      const err = new Error(`SKU ${sku} is already assigned to another product.`);
      err.statusCode = 409;
      throw err;
    }
    recentlyAllocated.set(skuNumber(sku), Date.now() + RESERVATION_TTL_MS);
  });
}

/**
 * Decides the SKUs for a new product. The product ID is its primary SKU. If the client supplied
 * `sku` (or `id`) it must be a valid, unused RS SKU; otherwise one is allocated. Every variant
 * receives its own SKU; the first variant shares the product's SKU.
 * Returns { productId, variants, autoAllocated }.
 */
export async function planNewProductSkus(body = {}, variants = []) {
  const requested = normalizeRequestedSku(body.sku ?? body.id);

  let productId;
  let autoAllocated = false;
  if (requested) {
    if (!isValidSku(requested)) throw new InvalidSkuError(body.sku ?? body.id);
    await claimRequestedSku(requested, requested);
    productId = requested;
  } else {
    [productId] = await allocateSkus(1);
    autoAllocated = true;
  }

  const finalVariants = await ensureVariantSkus(variants, { productId, reserved: [productId] });
  return { productId, variants: finalVariants, autoAllocated };
}
