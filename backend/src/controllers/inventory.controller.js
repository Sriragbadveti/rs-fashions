import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { invalidateCatalogCache } from "./catalog.controller.js";
import { uploadImageToSupabaseStorage } from "./upload.controller.js";
import {
  saveProductToStore,
  getProductsFromStore,
  saveColorToStore,
  getColorsFromStore,
} from "../database/localStore.js";
import { getPersistentVariantsMap, savePersistentVariantsMap } from "../services/inventory.service.js";
import { normalizeBorderInput, normalizePurchasePriceInput, writeProductRow } from "../services/productFields.js";
import {
  planNewProductSkus,
  assignSkusToProduct,
  releaseSkuReservations,
  SkuExhaustedError,
} from "../services/sku.service.js";

/**
 * Controller: Stock Movements Audit Trail, Bulk Loom Intake & Low Stock Alerts
 */

// In-memory micro-cache for stock movements
let cachedMovements = null;
let lastMovementsFetch = 0;
const CACHE_TTL_MS = 60 * 1000;

export function invalidateInventoryCache() {
  cachedMovements = null;
  lastMovementsFetch = 0;
}

// 1. GET ALL STOCK MOVEMENTS
export async function getMovements(req, res) {
  try {
    const now = Date.now();
    if (cachedMovements && now - lastMovementsFetch < CACHE_TTL_MS) {
      return successResponse(res, { movements: cachedMovements }, "Stock movements audit trail retrieved (cached)");
    }

    if (!supabase) return successResponse(res, { movements: [] });

    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    const movements = (data || []).map((m) => ({
      id: m.id,
      date: m.date,
      sku: m.sku,
      productName: m.product_name,
      color: m.color,
      colorSlug: m.color_slug,
      type: m.type,
      quantity: Number(m.quantity) || 0,
      previousStock: Number(m.previous_stock) || 0,
      newStock: Number(m.new_stock) || 0,
      referenceNumber: m.reference_number,
      performedBy: m.performed_by || "Store Manager",
      note: m.note || "",
    }));

    cachedMovements = movements;
    lastMovementsFetch = now;

    return successResponse(res, { movements }, "Stock movements audit trail retrieved");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 2. CREATE STOCK MOVEMENT
export async function createMovement(req, res) {
  try {
    const {
      id,
      date,
      sku,
      productName,
      color = "Standard",
      colorSlug = "STD",
      type = "RESTOCK",
      quantity,
      previousStock = 0,
      newStock,
      referenceNumber,
      performedBy = "Store Manager",
      note = "",
    } = req.body;

    if (!sku || !productName || quantity === undefined) {
      return errorResponse(res, "SKU, Product Name, and Quantity are required", 400);
    }

    const movId = id || `mov-${Date.now()}-${colorSlug}`;
    const movDate = date || new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (supabase) {
      const { data, error } = await supabase.from("stock_movements").insert([{
        id: movId,
        date: movDate,
        sku,
        product_name: productName,
        color,
        color_slug: colorSlug,
        type,
        quantity: Number(quantity),
        previous_stock: Number(previousStock),
        new_stock: Number(newStock ?? (Number(previousStock) + Number(quantity))),
        reference_number: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        performed_by: performedBy,
        note,
      }]).select().single();

      if (error) throw error;
      invalidateInventoryCache();
      return successResponse(res, { movement: data }, "Stock movement logged successfully", 201);
    }

    invalidateInventoryCache();
    return successResponse(res, { movement: req.body }, "Stock movement recorded locally", 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// Rows already saved by a previous bulk request, keyed by the browser's per-row clientRef, so a
// retry after a lost response or partial failure never creates the same product twice.
const savedBulkRows = new Map(); // clientRef -> { id, at }
const SAVED_BULK_ROW_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_IMAGES_PER_PRODUCT = 20;

function lookupSavedBulkRow(clientRef) {
  const hit = savedBulkRows.get(clientRef);
  if (!hit) return null;
  if (Date.now() - hit.at > SAVED_BULK_ROW_TTL_MS) {
    savedBulkRows.delete(clientRef);
    return null;
  }
  return hit.id;
}

async function productStillExists(id) {
  if (supabase) {
    const { data } = await supabase.from("products").select("id").eq("id", id).maybeSingle();
    return Boolean(data);
  }
  return getProductsFromStore().some((p) => p.id === id);
}

// 3. BULK LOOM INTAKE
export async function handleBulkIntake(req, res) {
  try {
    const { products = [], performer = "Store Manager", loomPartner = "Master Weaver Guild" } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return errorResponse(res, "At least one product is required for bulk intake", 400);
    }

    // Batch-level border default; each product may carry its own override.
    const batchBorder = normalizeBorderInput(req.body);

    // Resolve every product's SKU (= product ID) exactly once, on the server, so the products
    // row, the stock movement and the persistent variants map always reference the same product.
    // `clientRef` lets the browser match results back to its rows.
    const prepared = [];
    const planFailures = [];
    const alreadySaved = [];
    for (let idx = 0; idx < products.length; idx++) {
      const p = products[idx];
      const clientRef = p.clientRef ?? String(idx);
      const ownBorder = normalizeBorderInput(p);

      if (p.clientRef) {
        const savedId = lookupSavedBulkRow(String(p.clientRef));
        if (savedId && (await productStillExists(savedId))) {
          alreadySaved.push({ clientRef, id: savedId, alreadySaved: true });
          continue;
        }
      }

      const rawImages = Array.isArray(p.images) ? p.images : [];
      if (rawImages.length > MAX_IMAGES_PER_PRODUCT) {
        planFailures.push({ clientRef, id: null, error: `Too many photos (${rawImages.length}); a product can have at most ${MAX_IMAGES_PER_PRODUCT}.`, statusCode: 400 });
        continue;
      }

      try {
        const plan = await planNewProductSkus(p, Array.isArray(p.variants) ? p.variants : []);
        prepared.push({
          source: { ...p, variants: plan.variants },
          prodId: plan.productId,
          autoAllocated: plan.autoAllocated,
          clientRef,
          borderColor: ownBorder !== undefined ? ownBorder : batchBorder,
        });
      } catch (skuErr) {
        planFailures.push({ clientRef, id: p.sku ?? p.id ?? null, error: skuErr.message, statusCode: skuErr.statusCode });
        // Once the SKU range is exhausted no later product can succeed either.
        if (skuErr instanceof SkuExhaustedError) {
          for (let rest = idx + 1; rest < products.length; rest++) {
            planFailures.push({ clientRef: products[rest].clientRef ?? String(rest), id: null, error: skuErr.message, statusCode: 409 });
          }
          break;
        }
      }
    }

    // Register any custom colors used in this bulk intake batch
    for (const p of products) {
      const colorList = p.colors || (p.variants ? p.variants.map((v) => v.color) : []);
      for (const colStr of colorList) {
        if (!colStr) continue;
        const parts = String(colStr).split(/[/,&+]/).map((s) => s.trim()).filter(Boolean);
        for (const part of parts) {
          if (part.toLowerCase() !== "standard") {
            saveColorToStore(part);
          }
        }
      }
    }

    const imagesFor = (p) => {
      const list = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []);
      // Keep only real image references for THIS product, primary first, without duplicates.
      // blob: URLs are browser-local previews; persisting them produces permanently broken images.
      const valid = list.filter(
        (img) => typeof img === "string" && (/^https?:\/\//.test(img) || img.startsWith("data:image/"))
      );
      return Array.from(new Set(valid)).slice(0, MAX_IMAGES_PER_PRODUCT);
    };

    if (supabase) {
      try {
        await supabase.from("settings").upsert({
          key: "color_palette",
          value: getColorsFromStore(),
          updated_at: new Date().toISOString(),
        });
      } catch {
        // ignore
      }

      const insertedProducts = [];
      const insertedMovements = [];
      const insertedRefs = [];
      const failed = [...planFailures];
      const warnings = [];
      const vMapUpdates = {};

      for (const entry of prepared) {
        let { source: p, prodId } = entry;
        const { borderColor, clientRef, autoAllocated } = entry;
        const priceVal = Math.max(0, Number(p.salePrice || p.price) || 0);
        const origPriceVal = p.originalPrice ? Number(p.originalPrice) : Math.round(priceVal * 1.25);
        const stockTotal = Number(p.stock) || (p.variants ? p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : 1);
        const colorList = p.colors || (p.variants ? p.variants.map((v) => v.color) : ["Standard"]);
        let images = imagesFor(p);

        // Auto-convert any base64 images into Supabase Storage public CDN URLs
        images = await Promise.all(
          images.map(async (img, idx) => {
            if (typeof img === "string" && (img.startsWith("data:image/") || (img.length > 500 && !img.startsWith("http")))) {
              try {
                const uploaded = await uploadImageToSupabaseStorage(img, `${prodId}-bulk-img-${idx + 1}.jpg`);
                return uploaded.publicUrl;
              } catch (e) {
                console.warn("Bulk intake auto-upload notice:", e.message);
                return img;
              }
            }
            return img;
          })
        );

        const row = {
          id: prodId,
          name: p.name,
          category: p.category || "SiCo Gadwal Sarees",
          material: p.material || "SiCo",
          price: priceVal,
          original_price: origPriceVal,
          stock: stockTotal,
          images,
          colors: colorList,
          tags: p.tags || ["bulk-intake", "loom-arrival"],
          description: p.description || `Bulk loom intake for ${p.name}.`,
          updated_at: new Date().toISOString(),
        };
        if (borderColor !== undefined) row.border_color = borderColor;
        const purchasePriceVal = normalizePurchasePriceInput(p);
        if (purchasePriceVal !== undefined) row.purchase_price = purchasePriceVal;

        // Insert (not upsert) so a colliding SKU can never overwrite an existing product.
        let { data: prodData, error: prodErr, warnings: rowWarnings } = await writeProductRow(row, (r) =>
          supabase.from("products").insert(r).select().single()
        );
        // Another server instance took the same auto-allocated SKU first: allocate again.
        for (let attempt = 0; prodErr?.code === "23505" && autoAllocated && attempt < 3; attempt++) {
          try {
            const plan = await planNewProductSkus({}, p.variants || []);
            prodId = plan.productId;
            p = { ...p, variants: plan.variants };
          } catch (skuErr) {
            prodErr = skuErr;
            break;
          }
          ({ data: prodData, error: prodErr, warnings: rowWarnings } = await writeProductRow({ ...row, id: prodId }, (r) =>
            supabase.from("products").insert(r).select().single()
          ));
        }
        rowWarnings.forEach((w) => { if (!warnings.includes(w)) warnings.push(w); });

        if (prodErr || !prodData) {
          const reason = prodErr?.code === "23505"
            ? `SKU ${prodId} already exists`
            : (prodErr?.message || "Database did not confirm the insert");
          console.error(`[BulkIntake] Failed to insert ${prodId}:`, reason);
          releaseSkuReservations([prodId, ...(p.variants || []).map((v) => v.sku)]);
          failed.push({ clientRef, id: prodId, error: reason });
          continue;
        }

        await assignSkusToProduct([prodId, ...(p.variants || []).map((v) => v.sku)], prodId);
        insertedRefs.push({ clientRef, id: prodId });
        if (entry.source.clientRef) savedBulkRows.set(String(entry.source.clientRef), { id: prodId, at: Date.now() });
        insertedProducts.push({ ...prodData, borderColor: borderColor || undefined });
        saveProductToStore({ ...p, ...prodData, id: prodId, borderColor: borderColor || undefined });
        if (Array.isArray(p.variants) && p.variants.length > 0) {
          vMapUpdates[prodId] = p.variants;
        }

        // Movement record
        const { data: movData, error: movErr } = await supabase.from("stock_movements").insert([{
          id: `mov-bulk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          sku: prodId,
          product_name: p.name,
          color: colorList[0] || "Standard",
          color_slug: "BULK",
          type: "RESTOCK",
          quantity: stockTotal,
          previous_stock: 0,
          new_stock: stockTotal,
          reference_number: `LOOM-${loomPartner.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          performed_by: performer,
          note: `Bulk intake from ${loomPartner}`,
        }]).select().single();

        if (movErr) console.warn(`[BulkIntake] Stock movement log notice for ${prodId}:`, movErr.message);
        if (movData) insertedMovements.push(movData);
      }

      if (Object.keys(vMapUpdates).length > 0) {
        try {
          const vMap = await getPersistentVariantsMap();
          Object.assign(vMap, vMapUpdates);
          await savePersistentVariantsMap(vMap);
        } catch (vErr) {
          console.warn("[BulkIntake] Failed to persist variant mappings:", vErr.message);
        }
      }

      invalidateCatalogCache();
      invalidateInventoryCache();

      const payload = {
        count: insertedProducts.length,
        products: insertedProducts,
        insertedIds: [...alreadySaved.map((a) => a.id), ...insertedProducts.map((p) => p.id)],
        inserted: [...alreadySaved, ...insertedRefs],
        failed,
        movements: insertedMovements,
        colors: getColorsFromStore(),
        warnings,
      };

      if (failed.length > 0) {
        // 207-style partial result: the client keeps failed rows for a retry.
        const onlyClientErrors = failed.every((f) => f.statusCode && f.statusCode < 500);
        return res.status(insertedProducts.length > 0 ? 207 : onlyClientErrors ? 400 : 500).json({
          success: false,
          message: `${insertedProducts.length} of ${products.length} sarees saved; ${failed.length} failed.`,
          data: payload,
          ...payload,
        });
      }

      return successResponse(res, payload, `Successfully ingested ${insertedProducts.length} sarees into admin vault!`, 201);
    }

    for (const { source: p, prodId, borderColor } of prepared) {
      const priceVal = Math.max(0, Number(p.salePrice || p.price) || 0);
      const stockTotal = Number(p.stock) || (p.variants ? p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : 1);
      const colorList = p.colors || (p.variants ? p.variants.map((v) => v.color) : ["Standard"]);
      const images = imagesFor(p);
      saveProductToStore({
        ...p,
        id: prodId,
        price: priceVal,
        salePrice: priceVal,
        stock: stockTotal,
        colors: colorList,
        images,
        imageUrl: images[0],
        borderColor: borderColor || undefined,
      });
    }

    invalidateCatalogCache();
    invalidateInventoryCache();
    for (const p of prepared) {
      if (p.source.clientRef) savedBulkRows.set(String(p.source.clientRef), { id: p.prodId, at: Date.now() });
    }
    const insertedIds = [...alreadySaved.map((a) => a.id), ...prepared.map((p) => p.prodId)];
    const inserted = [...alreadySaved, ...prepared.map((p) => ({ clientRef: p.clientRef, id: p.prodId }))];
    if (planFailures.length > 0) {
      return res.status(inserted.length > 0 ? 207 : 400).json({
        success: false,
        message: `${inserted.length} of ${products.length} sarees saved; ${planFailures.length} failed.`,
        count: inserted.length,
        insertedIds,
        inserted,
        failed: planFailures,
        data: { insertedIds, inserted, failed: planFailures },
      });
    }
    return successResponse(res, { count: products.length, insertedIds, inserted, failed: [], colors: getColorsFromStore() }, "Bulk intake recorded locally", 201);
  } catch (err) {
    console.error("Bulk intake error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 4. LOW STOCK ALERTS
export async function getLowStockAlerts(req, res) {
  try {
    const threshold = Number(req.query.threshold) || 3;
    if (!supabase) return successResponse(res, { lowStock: [] });

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .lte("stock", threshold)
      .order("stock", { ascending: true });

    if (error) throw error;
    return successResponse(res, { lowStock: data || [] }, `Found ${(data || []).length} low stock items`);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}
