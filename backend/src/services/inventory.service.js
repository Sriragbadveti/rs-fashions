import { supabase } from "../config/supabase.js";
import { saveProductToStore, getProductsFromStore } from "../database/localStore.js";
import { invalidateCatalogCache } from "../controllers/catalog.controller.js";
import { invalidateBootstrapCache } from "../controllers/bootstrap.controller.js";

/**
 * Service: Unified Inventory Management & Variant-Aware Stock Deductions
 */

// Mutex locks to serialize concurrent stock deductions on the same product
const inventoryLocks = new Map();

async function acquireInventoryLock(productId, timeoutMs = 6000) {
  const start = Date.now();
  while (inventoryLocks.has(productId)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Inventory deduction timeout for product ${productId}. Another checkout is currently processing.`);
    }
    await new Promise((r) => setTimeout(r, 40));
  }
  inventoryLocks.set(productId, Date.now());
}

function releaseInventoryLock(productId) {
  inventoryLocks.delete(productId);
}

/**
 * Fetch persistent variant map from Supabase settings table.
 */
export async function getPersistentVariantsMap() {
  if (!supabase) return {};
  try {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "product_variants")
      .maybeSingle();

    if (data && data.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      return data.value;
    }
  } catch (err) {
    console.warn("[InventoryService] Failed to load persistent variants map:", err.message);
  }
  return {};
}

/**
 * Persist variant map to Supabase settings table.
 */
export async function savePersistentVariantsMap(variantsMap) {
  if (!supabase || !variantsMap) return;
  try {
    await supabase.from("settings").upsert({
      key: "product_variants",
      value: variantsMap,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[InventoryService] Failed to save persistent variants map:", err.message);
  }
}

/**
 * Verifies every ordered quantity is in stock BEFORE an order is created. Demand is totalled per
 * product/shade (the same saree on two lines counts once). Items whose product can't be located
 * are not blocked (legacy/custom lines). Returns [] when everything is available, otherwise
 * [{ name, color, requested, available }].
 */
const HOLD_TTL_MS = 10 * 60 * 1000;
const stockHolds = new Map(); // demand key -> Map(sessionId -> { qty, expiresAt })

function heldByOthers(key, sessionId) {
  const holders = stockHolds.get(key);
  if (!holders) return 0;
  const now = Date.now();
  let total = 0;
  for (const [sid, h] of holders) {
    if (h.expiresAt <= now) holders.delete(sid);
    else if (sid !== sessionId) total += h.qty;
  }
  if (holders.size === 0) stockHolds.delete(key);
  return total;
}

/** Releases every hold the session has (after the order is placed, or when it gives up). */
export function releaseHolds(sessionId) {
  if (!sessionId) return;
  for (const [key, holders] of stockHolds) {
    holders.delete(sessionId);
    if (holders.size === 0) stockHolds.delete(key);
  }
}

// One lock for check-then-deduct, so two customers can't both pass the stock check for the last
// piece. (In-process: if the API ever runs on several instances this must move into the database.)
let stockChain = Promise.resolve();
export function withStockLock(fn) {
  const run = stockChain.then(fn, fn);
  stockChain = run.catch(() => {});
  return run;
}

/**
 * Reserves the cart's pieces for `sessionId` for 10 minutes. Pieces other customers have
 * reserved (and not yet bought) don't count as available. Returns the shortages ([] = reserved).
 */
export function holdStock(items, sessionId, ttlMs = HOLD_TTL_MS) {
  return withStockLock(async () => {
    const { demand } = await computeStockDemand(items);
    const shortages = [];
    for (const [key, d] of demand) {
      const free = d.available - heldByOthers(key, sessionId);
      if (d.requested > free) shortages.push({ name: d.name, color: d.color, requested: d.requested, available: Math.max(0, free), heldByOthers: free < d.available });
    }
    if (shortages.length > 0) return shortages;
    releaseHolds(sessionId);
    for (const [key, d] of demand) {
      const holders = stockHolds.get(key) || new Map();
      holders.set(sessionId, { qty: d.requested, expiresAt: Date.now() + ttlMs });
      stockHolds.set(key, holders);
    }
    return [];
  });
}

export async function findStockShortages(items, { sessionId } = {}) {
  const { demand } = await computeStockDemand(items);
  const shortages = [];
  for (const [key, d] of demand) {
    const free = d.available - heldByOthers(key, sessionId);
    if (d.requested > free) shortages.push({ name: d.name, color: d.color, requested: d.requested, available: Math.max(0, free), heldByOthers: free < d.available });
  }
  return shortages;
}

async function computeStockDemand(items) {
  if (!Array.isArray(items) || items.length === 0) return { demand: new Map() };
  const variantsMap = await getPersistentVariantsMap();
  const localProds = supabase ? [] : getProductsFromStore();
  const demand = new Map(); // key -> { name, color, requested, available }

  for (const item of items) {
    const prodId = item.productId || item.id || item.sku;
    const itemSku = item.sku || null;
    const itemColor = String(item.color || item.selectedColor || "").trim().toLowerCase();
    const qty = Math.max(1, Number(item.qty || item.quantity) || 1);

    let prod = null;
    if (supabase) {
      for (const id of [prodId, itemSku]) {
        if (!id || prod) continue;
        const { data } = await supabase.from("products").select("id, name, stock, colors").eq("id", id).maybeSingle();
        if (data) prod = data;
      }
    } else {
      prod = localProds.find((p) => p.id === prodId || p.id === itemSku) || null;
    }
    if (!prod) continue;

    const variants = Array.isArray(variantsMap[prod.id]) && variantsMap[prod.id].length > 0
      ? variantsMap[prod.id]
      : Array.isArray(prod.variants) ? prod.variants : [];

    let key = `p:${prod.id}`;
    let available = Number(prod.stock) || 0;
    let color = "";
    if (variants.length > 0) {
      const v =
        variants.find((x) => itemSku && x.sku && x.sku.toLowerCase() === String(itemSku).toLowerCase()) ||
        variants.find((x) => prodId && x.sku && x.sku.toLowerCase() === String(prodId).toLowerCase()) ||
        variants.find((x) => itemColor && x.color && x.color.trim().toLowerCase() === itemColor);
      if (v) {
        key = `v:${prod.id}:${v.sku || v.color}`;
        available = Number(v.stock) || 0;
        color = v.color || "";
      } else {
        available = variants.reduce((sum, x) => sum + (Number(x.stock) || 0), 0);
      }
    }

    const entry = demand.get(key) || { name: item.name || prod.name, color, requested: 0, available };
    entry.requested += qty;
    demand.set(key, entry);
  }

  return { demand };
}

/**
 * Puts the pieces of a cancelled order back into stock (variant + product total) and logs a
 * RETURN movement per line. Mirror image of deductStockForOrderItems.
 */
export function restoreStockForOrderItems(items, { referenceNumber = "CANCEL", performedBy = "Store Manager", note = "Order cancelled: stock restored" } = {}) {
  return withStockLock(async () => {
    const variantsMap = await getPersistentVariantsMap();
    const restored = [];

    for (const item of Array.isArray(items) ? items : []) {
      const prodId = item.productId || item.id || item.sku;
      const itemSku = item.sku || null;
      const itemColor = String(item.color || item.selectedColor || "").trim().toLowerCase();
      const qty = Math.max(1, Number(item.qty || item.quantity) || 1);

      let prod = null;
      if (supabase) {
        for (const id of [prodId, itemSku]) {
          if (!id || prod) continue;
          const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
          if (data) prod = data;
        }
      } else {
        prod = getProductsFromStore().find((p) => p.id === prodId || p.id === itemSku) || null;
      }
      if (!prod) continue;

      let variants = Array.isArray(variantsMap[prod.id]) ? JSON.parse(JSON.stringify(variantsMap[prod.id])) : [];
      if (variants.length === 0 && !supabase && Array.isArray(prod.variants)) variants = JSON.parse(JSON.stringify(prod.variants));
      const previousStock = variants.length > 0 ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) : Number(prod.stock) || 0;

      let color = itemColor ? item.color || item.selectedColor : prod.colors?.[0] || "Standard";
      if (variants.length > 0) {
        let idx = -1;
        if (itemSku) idx = variants.findIndex((v) => v.sku && v.sku.toLowerCase() === String(itemSku).toLowerCase());
        if (idx === -1 && prodId) idx = variants.findIndex((v) => v.sku && v.sku.toLowerCase() === String(prodId).toLowerCase());
        if (idx === -1 && itemColor) idx = variants.findIndex((v) => v.color && v.color.trim().toLowerCase() === itemColor);
        if (idx === -1) idx = 0;
        variants[idx] = { ...variants[idx], stock: (Number(variants[idx].stock) || 0) + qty };
        color = variants[idx].color || color;
        variantsMap[prod.id] = variants;
      }
      const newStock = previousStock + qty;

      if (supabase) {
        await supabase.from("products").update({ stock: newStock, updated_at: new Date().toISOString() }).eq("id", prod.id);
        const { error: movErr } = await supabase.from("stock_movements").insert([{
          id: `mov-cancel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          sku: itemSku || prod.id,
          product_name: item.name || prod.name,
          color: color || "Standard",
          color_slug: String(color || "STD").slice(0, 3).toUpperCase(),
          type: "RETURN",
          quantity: qty,
          previous_stock: previousStock,
          new_stock: newStock,
          reference_number: referenceNumber,
          performed_by: performedBy,
          note,
        }]);
        if (movErr) console.warn("[InventoryService] cancel movement log notice:", movErr.message);
      } else {
        saveProductToStore({ ...prod, stock: newStock, variants: variants.length > 0 ? variants : prod.variants });
      }
      restored.push({ productId: prod.id, name: prod.name, qty, newStock });
    }

    if (supabase && Object.keys(variantsMap).length > 0) await savePersistentVariantsMap(variantsMap);
    invalidateCatalogCache();
    invalidateBootstrapCache();
    return restored;
  });
}

/**
 * Deducts stock for a purchased item both at the variant level and product level.
 * Updates:
 * 1. Supabase products table (stock column)
 * 2. Supabase settings table (product_variants key)
 * 3. Supabase stock_movements table (immutable audit trail)
 * 4. Local fallback store (products.json)
 * 5. In-memory caches (catalog & bootstrap)
 */
export async function deductStockForItem({
  item,
  referenceNumber = `ORD-${Date.now().toString().slice(-6)}`,
  paymentMethod = "cod",
  performedBy = "Online Storefront",
  notePrefix = "Order",
}) {
  const prodId = item.productId || item.id || item.sku;
  // Legacy SKUs start with "RSF-"; current SKUs are "RS" + four digits (e.g. RS0001).
  const itemSku = item.sku || (typeof item.id === "string" && (item.id.startsWith("RSF-") || /^RS\d{4}$/.test(item.id)) ? item.id : null);
  const itemColor = (item.color || item.selectedColor || "").trim();
  const qtyToDeduct = Math.max(1, Number(item.qty || item.quantity) || 1);

  if (!prodId && !itemSku && !item.name) {
    console.warn("[InventoryService] Cannot deduct stock: missing item identifier", item);
    return null;
  }

  const lockKey = prodId || itemSku || item.name;
  await acquireInventoryLock(lockKey);

  try {
    let currentProd = null;

    // 1. Locate product in Supabase (Single Source of Truth)
    if (supabase) {
      try {
        if (prodId) {
          const { data } = await supabase.from("products").select("*").eq("id", prodId).maybeSingle();
          if (data) currentProd = data;
        }

        if (!currentProd && itemSku) {
          const { data } = await supabase.from("products").select("*").eq("id", itemSku).maybeSingle();
          if (data) currentProd = data;
        }

        if (!currentProd) {
          const { data: allProds } = await supabase.from("products").select("*");
          if (Array.isArray(allProds)) {
            currentProd = allProds.find((p) => {
              if (p.id === prodId || p.id === itemSku) return true;
              if (item.name && p.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase()) return true;
              return false;
            });
          }
        }
      } catch (dbErr) {
        console.warn("[InventoryService] DB query notice:", dbErr.message);
      }
    } else {
      // Offline local development fallback only
      const localProds = getProductsFromStore();
      currentProd = localProds.find((p) => {
        if (p.id === prodId || p.id === itemSku) return true;
        if (Array.isArray(p.variants) && p.variants.some((v) => v.sku === itemSku || v.sku === prodId)) return true;
        if (item.name && p.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase()) return true;
        return false;
      });
    }

    if (!currentProd) {
      console.warn(`[InventoryService] Product not found in database for deduction: prodId=${prodId}, sku=${itemSku}, name=${item.name}`);
      return null;
    }

    const effectiveProdId = currentProd.id;
    const previousStock = Number(currentProd.stock) || 0;

  // 2. Load variants for this product
  const variantsMap = await getPersistentVariantsMap();
  let productVariants = variantsMap[effectiveProdId];

  // If not found in settings map, check localStore or construct from colors
  if (!Array.isArray(productVariants) || productVariants.length === 0) {
    const localProd = getProductsFromStore().find((p) => p.id === effectiveProdId);
    if (Array.isArray(localProd?.variants) && localProd.variants.length > 0) {
      productVariants = JSON.parse(JSON.stringify(localProd.variants));
    } else {
      const colorList = Array.isArray(currentProd.colors) && currentProd.colors.length > 0 ? currentProd.colors : ["Standard"];
      const images = Array.isArray(currentProd.images) ? currentProd.images : [];
      productVariants = colorList.map((col, idx) => ({
        color: col,
        colorSlug: col.slice(0, 3).toUpperCase(),
        stock: idx === 0 ? previousStock : 0,
        sku: `${effectiveProdId}-${col.slice(0, 3).toUpperCase()}`,
        imageUrl: images[idx] || images[0] || "",
      }));
    }
  } else {
    // Clone
    productVariants = JSON.parse(JSON.stringify(productVariants));
  }

  // 3. Deduct stock from the matching variant
  let targetVariant = null;
  let targetIdx = -1;

  if (productVariants.length > 0) {
    // Priority 1: Match by variant SKU
    if (itemSku) {
      targetIdx = productVariants.findIndex((v) => v.sku && v.sku.toLowerCase() === itemSku.toLowerCase());
    }
    // Priority 2: Match by prodId as SKU
    if (targetIdx === -1 && prodId) {
      targetIdx = productVariants.findIndex((v) => v.sku && v.sku.toLowerCase() === prodId.toLowerCase());
    }
    // Priority 3: Match by color
    if (targetIdx === -1 && itemColor) {
      const normColor = itemColor.toLowerCase();
      targetIdx = productVariants.findIndex((v) => v.color && v.color.trim().toLowerCase() === normColor);
    }
    // Priority 4: First variant that has stock >= qtyToDeduct
    if (targetIdx === -1) {
      targetIdx = productVariants.findIndex((v) => (Number(v.stock) || 0) >= qtyToDeduct);
    }
    // Priority 5: Fallback to the first variant
    if (targetIdx === -1) {
      targetIdx = 0;
    }

    if (targetIdx >= 0 && targetIdx < productVariants.length) {
      const v = productVariants[targetIdx];
      const prevVarStock = Number(v.stock) || 0;
      const newVarStock = Math.max(0, prevVarStock - qtyToDeduct);
      productVariants[targetIdx] = {
        ...v,
        stock: newVarStock,
      };
      targetVariant = productVariants[targetIdx];
    }
  }

  // 4. Calculate new total stock
  const newTotalStock = productVariants.length > 0
    ? productVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : Math.max(0, previousStock - qtyToDeduct);

  // 5. Persist updated variant map to Supabase settings
  variantsMap[effectiveProdId] = productVariants;
  await savePersistentVariantsMap(variantsMap);

  // 6. Update products table in Supabase
  if (supabase) {
    try {
      const { error: updErr } = await supabase
        .from("products")
        .update({
          stock: newTotalStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", effectiveProdId);

      if (updErr) {
        console.warn(`[InventoryService] Error updating products.stock for ${effectiveProdId}:`, updErr.message);
      }
    } catch (e) {
      console.warn("[InventoryService] Supabase stock update note:", e.message);
    }
  }

    // 7. Update localStore only in local offline development mode
    if (!supabase) {
      try {
        saveProductToStore({
          ...currentProd,
          stock: newTotalStock,
          variants: productVariants,
        });
      } catch {}
    }

  // 8. Log SALE in stock_movements table
  const deductedColor = targetVariant?.color || itemColor || (currentProd.colors && currentProd.colors[0]) || "Standard";
  const deductedSku = targetVariant?.sku || itemSku || effectiveProdId;
  const colorSlug = item.colorSlug || targetVariant?.colorSlug || deductedColor.slice(0, 3).toUpperCase();

  if (supabase) {
    try {
      await supabase.from("stock_movements").insert([{
        id: `mov-${Date.now()}-${colorSlug}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        sku: deductedSku,
        product_name: item.name || currentProd.name,
        color: deductedColor,
        color_slug: colorSlug,
        type: "SALE",
        quantity: -qtyToDeduct,
        previous_stock: previousStock,
        new_stock: newTotalStock,
        reference_number: referenceNumber,
        performed_by: performedBy,
        note: `${notePrefix} #${referenceNumber} (${(paymentMethod || "COD").toUpperCase()})`,
      }]);
    } catch (movErr) {
      console.warn("[InventoryService] Failed to insert stock movement:", movErr.message);
    }
  }

    return {
      productId: effectiveProdId,
      previousStock,
      newTotalStock,
      newStock: newTotalStock,
      targetVariant,
      variants: productVariants,
    };
  } finally {
    releaseInventoryLock(lockKey);
  }
}

/**
 * Deducts stock for a batch of order items and invalidates all caches.
 */
export async function deductStockForOrderItems(items, {
  referenceNumber,
  paymentMethod = "cod",
  performedBy = "Online Storefront",
  notePrefix = "Order",
}) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const results = [];
  for (const item of items) {
    try {
      const res = await deductStockForItem({
        item,
        referenceNumber,
        paymentMethod,
        performedBy,
        notePrefix,
      });
      if (res) results.push(res);
    } catch (err) {
      console.warn("[InventoryService] Item deduction error:", err.message);
    }
  }

  // Bust in-memory caches so admin and storefront immediately reflect decremented stock
  try {
    invalidateCatalogCache();
    invalidateBootstrapCache();
  } catch {}

  return results;
}
