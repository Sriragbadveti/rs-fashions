import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { uploadImageToSupabaseStorage } from "./upload.controller.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";
import {
  getProductsFromStore,
  saveProductToStore,
  deleteProductFromStore,
  getColorsFromStore,
  saveColorToStore,
  saveColorsToStore,
} from "../database/localStore.js";
import { getPersistentVariantsMap, savePersistentVariantsMap } from "../services/inventory.service.js";

/**
 * Controller: Saree Catalog & Categories
 */

let cachedProducts = null;
let lastProductsFetch = 0;
let inFlightProductsPromise = null;

let cachedCategories = null;
let lastCategoriesFetch = 0;
let inFlightCategoriesPromise = null;

const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Resilient database query wrapper with exponential backoff and jitter
 */
async function queryWithRetry(queryFn, maxRetries = 2, baseDelay = 250) {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await queryFn();
      if (res && res.error) throw res.error;
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 80);
        await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt) + jitter));
      }
    }
  }
  throw lastError;
}

export function invalidateCatalogCache() {
  cachedProducts = null;
  cachedCategories = null;
  lastProductsFetch = 0;
  lastCategoriesFetch = 0;
  invalidateBootstrapCache();
}

export const VIBGYOR_COLORS = new Set([
  "violet",
  "indigo",
  "blue",
  "green",
  "yellow",
  "orange",
  "red",
]);

export function validateVibgyorColors(colorList) {
  if (!Array.isArray(colorList) || colorList.length === 0) return true;
  for (const c of colorList) {
    if (!c) continue;
    const parts = String(c).split(/[/,&+]/).map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      if (p.toLowerCase() === "standard") continue;
      saveColorToStore(p);
    }
  }
  return true;
}

// 1. GET ALL PRODUCTS
export async function getProducts(req, res) {
  try {
    const isTrendingOnly =
      req.query.trending === "true" ||
      req.query.special_offer === "true" ||
      req.query.limited_edition === "true";

    const filterTrending = (list) => {
      if (!isTrendingOnly) return list;
      return list.filter(
        (p) =>
          Boolean(p.isLimitedEdition) ||
          Boolean(p.isSpecialOffer) ||
          (Array.isArray(p.tags) &&
            p.tags.some((t) =>
              ["limited_edition", "special_offer", "trending", "offers"].includes(
                String(t).trim().toLowerCase()
              )
            ))
      );
    };

    if (cachedProducts && Date.now() - lastProductsFetch < CACHE_TTL_MS) {
      return successResponse(
        res,
        { products: filterTrending(cachedProducts) },
        "Products retrieved successfully (cached)"
      );
    }

    if (!inFlightProductsPromise) {
      inFlightProductsPromise = (async () => {
        let rawData = [];

        if (supabase) {
          try {
            const { data } = await queryWithRetry(() =>
              supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: false })
            );

            if (Array.isArray(data)) {
              rawData = data;
            }
          } catch (dbErr) {
            console.error("[CatalogController] Supabase products query error after retries:", dbErr.message);
            if (cachedProducts && cachedProducts.length > 0) {
              return cachedProducts;
            }
            throw dbErr;
          }
        } else {
          // Local development / testing mode without Supabase credentials
          rawData = getProductsFromStore();
        }

        const persistentVariantsMap = await getPersistentVariantsMap();

        const products = (rawData || []).map((p) => {
          const colorList = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ["Standard"];
          const stockTotal = Number(p.stock) || 0;
          const images = Array.isArray(p.images) && p.images.length > 0 
            ? p.images 
            : (p.image_url || p.imageUrl ? [p.image_url || p.imageUrl] : []);

          const pVariants = (persistentVariantsMap[p.id] && Array.isArray(persistentVariantsMap[p.id]) && persistentVariantsMap[p.id].length > 0)
            ? persistentVariantsMap[p.id]
            : (Array.isArray(p.variants) && p.variants.length > 0
                ? p.variants
                : colorList.map((col, idx) => ({
                    color: col,
                    colorSlug: col.slice(0, 3).toUpperCase(),
                    stock: idx === 0 ? stockTotal : 0,
                    sku: `${p.id}-${col.slice(0, 3).toUpperCase()}`,
                    imageUrl: images[idx] || images[0],
                  }))
              );

          const finalStock = pVariants.length > 0
            ? pVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
            : stockTotal;

          const tags = Array.isArray(p.tags) ? p.tags : ["handloom", "sico"];

          const isSpecialOffer =
            tags.includes("special_offer") ||
            Boolean(p.is_special_offer) ||
            Boolean(p.isSpecialOffer);

          const isLimitedEdition =
            tags.includes("limited_edition") ||
            Boolean(p.is_limited_edition) ||
            Boolean(p.isLimitedEdition);

          return {
            id: p.id,
            name: p.name,
            category: p.category || "SiCo Gadwal Sarees",
            categoryId: p.category_id || p.categoryId || "c1",
            material: p.material || "SiCo",
            price: Number(p.price || p.sale_price || p.salePrice) || 0,
            salePrice: Number(p.price || p.sale_price || p.salePrice) || 0,
            purchasePrice: Number(p.purchase_price || p.purchasePrice) || 0,
            originalPrice: Number(p.original_price || p.originalPrice) || Math.round((Number(p.price || p.salePrice) || 0) * 1.25),
            stock: finalStock,
            variants: pVariants,
            images,
            imageUrl: images[0] || p.imageUrl || p.image_url,
            colors: colorList,
            tags,
            isSpecialOffer,
            isLimitedEdition,
            description: p.description || `${p.name} - Handcrafted Gadwal saree.`,
            featured: Boolean(p.featured),
            borderColor: p.border_color || p.borderColor || undefined,
          };
        });

        cachedProducts = products;
        lastProductsFetch = Date.now();
        return products;
      })().finally(() => {
        inFlightProductsPromise = null;
      });
    }

    const products = await inFlightProductsPromise;
    return successResponse(
      res,
      { products: filterTrending(products) },
      "Products retrieved successfully"
    );
  } catch (err) {
    if (cachedProducts && cachedProducts.length > 0) {
      return successResponse(
        res,
        { products: filterTrending(cachedProducts) },
        "Products retrieved successfully (stale cache recovery)"
      );
    }
    return errorResponse(res, "Product catalog service is temporarily unavailable. Please try again shortly.", 503);
  }
}


// 2. GET ALL CATEGORIES
export async function getCategories(req, res) {
  try {
    if (cachedCategories && Date.now() - lastCategoriesFetch < CACHE_TTL_MS) {
      return successResponse(res, { categories: cachedCategories }, "Categories retrieved successfully (cached)");
    }

    if (!supabase) return successResponse(res, { categories: [] });

    if (!inFlightCategoriesPromise) {
      inFlightCategoriesPromise = (async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;

        const categories = (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          imageUrl: c.image_url || "",
          hsn: c.hsn || "5208",
          sortOrder: Number(c.sort_order || c.next_sequence) || 0,
        }));

        cachedCategories = categories;
        lastCategoriesFetch = Date.now();
        return categories;
      })().finally(() => {
        inFlightCategoriesPromise = null;
      });
    }

    const categories = await inFlightCategoriesPromise;
    return successResponse(res, { categories }, "Categories retrieved successfully");
  } catch (err) {
    if (cachedCategories) {
      return successResponse(res, { categories: cachedCategories }, "Categories retrieved successfully (fallback)");
    }
    return errorResponse(res, err.message, 500);
  }
}

// 3. CREATE PRODUCT
let recentCreateTimes = [];
export async function createProduct(req, res) {
  try {
    const now = Date.now();
    recentCreateTimes = recentCreateTimes.filter((t) => now - t < 10000);
    // Block automated single-product creation spam (stale clients trying to auto-re-upload catalog)
    if (recentCreateTimes.length >= 3 && req.headers["x-allow-bulk-create"] !== "true") {
      console.warn(
        `[Catalog] Blocked automated rapid POST /api/catalog (${recentCreateTimes.length} creates in 10s). Rejecting stale client auto-push.`
      );
      return errorResponse(
        res,
        "Automated bulk creation on single product endpoint blocked. Please use Bulk Intake for bulk restocks.",
        429
      );
    }
    recentCreateTimes.push(now);
    const {
      id,
      name,
      categoryId,
      category,
      material,
      purchasePrice,
      salePrice,
      price,
      originalPrice,
      tags = [],
      variants = [],
      imageUrl,
      images = [],
      colors = [],
      description,
      featured = false,
    } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, "Product name is required", 400);
    }

    const priceVal = Math.max(0, Number(salePrice || price) || 0);
    const origPriceVal = originalPrice
      ? Math.max(priceVal, Number(originalPrice))
      : Math.max(priceVal * 1.25, Number(purchasePrice ? purchasePrice * 1.3 : priceVal * 1.25));

    const totalStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : Math.max(0, Number(req.body.stock) || 0);

    const colorNames = variants.length > 0
      ? variants.map((v) => v.color).filter(Boolean)
      : (colors.length > 0 ? colors : ["Standard"]);

    if (!validateVibgyorColors(colorNames)) {
      return errorResponse(
        res,
        "Color options must be restricted to VIBGYOR colors: Violet, Indigo, Blue, Green, Yellow, Orange, Red.",
        400
      );
    }

    let finalTags = Array.isArray(tags) ? [...tags] : [];
    if (req.body.isSpecialOffer === true) {
      if (!finalTags.includes("special_offer")) finalTags.push("special_offer");
    } else if (req.body.isSpecialOffer === false) {
      finalTags = finalTags.filter((t) => t !== "special_offer");
    }

    let finalImages = images.length > 0
      ? [...images]
      : (imageUrl ? [imageUrl] : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"]);

    const prodId = id || `saree-${Date.now().toString(36)}`;

    // Auto-convert any base64 images into Supabase Storage public CDN URLs
    finalImages = await Promise.all(
      finalImages.map(async (img, idx) => {
        if (typeof img === "string" && (img.startsWith("data:image/") || (img.length > 500 && !img.startsWith("http")))) {
          try {
            const uploaded = await uploadImageToSupabaseStorage(img, `${prodId}-img-${idx + 1}.jpg`);
            return uploaded.publicUrl;
          } catch (e) {
            console.warn("Auto-upload base64 to Supabase storage notice:", e.message);
            return img;
          }
        }
        return img;
      })
    );

    // Resolve category name
    let resolvedCategory = category;
    if (!resolvedCategory && categoryId && supabase) {
      try {
        const { data: catRow } = await supabase.from("categories").select("name").eq("id", categoryId).single();
        if (catRow?.name) resolvedCategory = catRow.name;
      } catch {
        // ignore
      }
    }
    if (!resolvedCategory) resolvedCategory = material || "SiCo Gadwal Sarees";
    const resolvedMaterial = material || resolvedCategory || "SiCo";

    if (supabase) {
      const { data, error } = await supabase.from("products").upsert({
        id: prodId,
        name: name.trim(),
        category: resolvedCategory,
        material: resolvedMaterial,
        price: priceVal,
        original_price: origPriceVal,
        stock: totalStock,
        images: finalImages,
        colors: colorNames,
        tags: finalTags,

        rating: 4.8,
        review_count: 0,
        featured: Boolean(featured),
        description: description || `Handcrafted ${name} saree drape.`,
        updated_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      // Auto-create initial RESTOCK movement log
      if (totalStock > 0) {
        try {
          await supabase.from("stock_movements").insert([{
            id: `mov-${Date.now()}-init`,
            date: new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            sku: prodId,
            product_name: name.trim(),
            color: colorNames[0] || "Standard",
            color_slug: "STD",
            type: "RESTOCK",
            quantity: totalStock,
            previous_stock: 0,
            new_stock: totalStock,
            reference_number: `INIT-${prodId.slice(-6)}`,
            performedBy: "Store Manager",
            note: "Initial saree catalog registration into vault",
          }]);
        } catch (movErr) {
          console.warn("Stock movement logging notice:", movErr.message);
        }
      }

      // Increment sequence in categories table
      if (categoryId) {
        try {
          const { data: cat } = await supabase.from("categories").select("next_sequence").eq("id", categoryId).single();
          if (cat) {
            await supabase.from("categories").update({ next_sequence: (cat.next_sequence || 1) + 1 }).eq("id", categoryId);
          }
        } catch {
          // ignore
        }
      }

      // Persist shade variants into persistentVariantsMap in settings table
      if (Array.isArray(variants) && variants.length > 0) {
        try {
          const vMap = await getPersistentVariantsMap();
          vMap[prodId] = variants;
          await savePersistentVariantsMap(vMap);
        } catch (vErr) {
          console.warn("Failed to persist variant mappings on createProduct:", vErr.message);
        }
      }

      invalidateCatalogCache();
      return successResponse(
        res,
        { product: { ...data, variants: variants && variants.length > 0 ? variants : undefined } },
        "Saree catalogued successfully",
        201
      );
    }

    const localPayload = {
      id: prodId,
      name: name.trim(),
      category: resolvedCategory,
      categoryId: categoryId || "c1",
      material: resolvedMaterial,
      price: priceVal,
      salePrice: priceVal,
      purchasePrice: Number(req.body.purchasePrice) || 0,
      originalPrice: origPriceVal,
      stock: totalStock,
      images: finalImages,
      imageUrl: finalImages[0],
      colors: colorNames,
      tags: finalTags,
      isSpecialOffer: Boolean(req.body.isSpecialOffer || finalTags.includes("special_offer")),
      isLimitedEdition: Boolean(req.body.isLimitedEdition || finalTags.includes("limited_edition")),
      variants,
      rating: 4.8,
      reviewCount: 0,
      featured: Boolean(featured),
      borderColor: req.body.borderColor || undefined,
      description: description || `Handcrafted ${name} saree drape.`,
    };

    if (variants && variants.length > 0) {
      try {
        const vMap = await getPersistentVariantsMap();
        vMap[prodId] = variants;
        await savePersistentVariantsMap(vMap);
      } catch {}
    }

    saveProductToStore(localPayload);
    invalidateCatalogCache();
    return successResponse(res, { product: localPayload }, "Saree created locally", 201);
  } catch (err) {
    console.error("Create product error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 3. UPDATE PRODUCT
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      categoryId,
      category,
      material,
      salePrice,
      price,
      originalPrice,
      tags,
      variants = [],
      images,
      imageUrl,
      colors,
      description,
      stock,
      featured,
    } = req.body;

    if (colors && !validateVibgyorColors(colors)) {
      return errorResponse(
        res,
        "Color options must be restricted to VIBGYOR colors: Violet, Indigo, Blue, Green, Yellow, Orange, Red.",
        400
      );
    }

    if (variants && variants.length > 0) {
      const vColors = variants.map((v) => v.color).filter(Boolean);
      if (!validateVibgyorColors(vColors)) {
        return errorResponse(
          res,
          "Color options must be restricted to VIBGYOR colors: Violet, Indigo, Blue, Green, Yellow, Orange, Red.",
          400
        );
      }
    }

    let resolvedCategory = category;
    if (!resolvedCategory && categoryId && supabase) {
      try {
        const { data: catRow } = await supabase.from("categories").select("name").eq("id", categoryId).single();
        if (catRow?.name) resolvedCategory = catRow.name;
      } catch {
        // ignore
      }
    }

    if (supabase) {
      const updates = { updated_at: new Date().toISOString() };

      if (name) updates.name = name.trim();
      if (resolvedCategory) updates.category = resolvedCategory;
      if (material) updates.material = material;
      if (salePrice !== undefined || price !== undefined) {
        const priceVal = Math.max(0, Number(salePrice || price) || 0);
        updates.price = priceVal;
        if (originalPrice !== undefined) {
          updates.original_price = Math.max(priceVal, Number(originalPrice));
        }
      }
      if (tags) updates.tags = tags;

      if (req.body.isSpecialOffer !== undefined) {
        let currentTags = updates.tags ? [...updates.tags] : [];
        if (!updates.tags) {
          try {
            const { data: prodData } = await supabase.from("products").select("tags").eq("id", id).single();
            if (prodData?.tags) currentTags = Array.isArray(prodData.tags) ? [...prodData.tags] : [];
          } catch {}
        }
        if (req.body.isSpecialOffer) {
          if (!currentTags.includes("special_offer")) currentTags.push("special_offer");
        } else {
          currentTags = currentTags.filter((t) => t !== "special_offer");
        }
        updates.tags = currentTags;
      }

      if (req.body.isLimitedEdition !== undefined) {
        let currentTags = updates.tags ? [...updates.tags] : [];
        if (!updates.tags) {
          try {
            const { data: prodData } = await supabase.from("products").select("tags").eq("id", id).single();
            if (prodData?.tags) currentTags = Array.isArray(prodData.tags) ? [...prodData.tags] : [];
          } catch {}
        }
        if (req.body.isLimitedEdition) {
          if (!currentTags.includes("limited_edition")) currentTags.push("limited_edition");
        } else {
          currentTags = currentTags.filter((t) => t !== "limited_edition");
        }
        updates.tags = currentTags;
      }

      if (variants && variants.length > 0) {
        const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        const colorNames = variants.map((v) => v.color).filter(Boolean);
        updates.stock = totalStock;
        updates.colors = colorNames;
      } else if (stock !== undefined) {
        updates.stock = Math.max(0, Number(stock) || 0);
      }

      if (images && Array.isArray(images)) {
        updates.images = await Promise.all(
          images.map(async (img, idx) => {
            if (typeof img === "string" && (img.startsWith("data:image/") || (img.length > 500 && !img.startsWith("http")))) {
              try {
                const uploaded = await uploadImageToSupabaseStorage(img, `${id}-update-img-${idx + 1}.jpg`);
                return uploaded.publicUrl;
              } catch (e) {
                console.warn("Auto-upload base64 on update notice:", e.message);
                return img;
              }
            }
            return img;
          })
        );
      } else if (imageUrl) {
        if (typeof imageUrl === "string" && (imageUrl.startsWith("data:image/") || (imageUrl.length > 500 && !imageUrl.startsWith("http")))) {
          try {
            const uploaded = await uploadImageToSupabaseStorage(imageUrl, `${id}-update-img-1.jpg`);
            updates.images = [uploaded.publicUrl];
          } catch (e) {
            updates.images = [imageUrl];
          }
        } else {
          updates.images = [imageUrl];
        }
      }
      if (colors && Array.isArray(colors)) updates.colors = colors;
      // Check previous stock to log RESTOCK movement if stock increases
      let previousStock = 0;
      let existingProductName = name;
      try {
        const { data: oldProd } = await supabase.from("products").select("stock, name").eq("id", id).single();
        if (oldProd) {
          previousStock = Number(oldProd.stock) || 0;
          if (!existingProductName) existingProductName = oldProd.name;
        }
      } catch {
        // ignore
      }

      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116" || error.details?.includes("0 rows")) {
          return errorResponse(res, `Product ${id} not found`, 404);
        }
        throw error;
      }

      if (updates.stock !== undefined && updates.stock > previousStock) {
        const diff = updates.stock - previousStock;
        try {
          await supabase.from("stock_movements").insert([{
            id: `mov-${Date.now()}-upd`,
            date: new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            sku: id,
            product_name: existingProductName || id,
            color: (updates.colors && updates.colors[0]) || "Standard",
            color_slug: "STD",
            type: "RESTOCK",
            quantity: diff,
            previous_stock: previousStock,
            new_stock: updates.stock,
            reference_number: `RESTOCK-${id.slice(-6)}`,
            performed_by: "Store Manager",
            note: `Saree stock replenished: +${diff} drapes`,
          }]);
        } catch (movErr) {
          console.warn("Stock movement log notice on updateProduct:", movErr.message);
        }
      }

      if (variants && variants.length > 0) {
        try {
          const vMap = await getPersistentVariantsMap();
          vMap[id] = variants;
          await savePersistentVariantsMap(vMap);
        } catch {}
      }

      invalidateCatalogCache();
      return successResponse(res, { product: { ...data, variants: variants && variants.length > 0 ? variants : undefined } }, "Product updated successfully");
    }

    const localUpdated = saveProductToStore({ id, ...req.body });
    invalidateCatalogCache();
    return successResponse(res, { product: localUpdated }, "Product updated locally");
  } catch (err) {
    console.error("Update product error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 4. DELETE PRODUCT
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    if (supabase) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    } else {
      deleteProductFromStore(id);
    }
    try {
      const vMap = await getPersistentVariantsMap();
      if (vMap[id]) {
        delete vMap[id];
        await savePersistentVariantsMap(vMap);
      }
    } catch {}
    invalidateCatalogCache();
    return successResponse(res, { id }, "Product deleted successfully");
  } catch (err) {
    console.error("Delete product error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 4b. BATCH DELETE PRODUCTS
export async function batchDeleteProducts(req, res) {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, "Product IDs array is required", 400);
    }
    if (supabase) {
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
    }
    for (const id of ids) {
      deleteProductFromStore(id);
    }
    invalidateCatalogCache();
    return successResponse(res, { count: ids.length, ids }, "Products batch-deleted successfully");
  } catch (err) {
    console.error("Batch delete products error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 5. CREATE CATEGORY
export async function createCategory(req, res) {
  try {
    const { id, name, slug, hsn, nextSequence } = req.body;
    if (!name || !slug) {
      return errorResponse(res, "Category name and slug are required", 400);
    }

    const catId = id || `cat-${Date.now().toString(36)}`;
    if (supabase) {
      const { data, error } = await supabase.from("categories").upsert({
        id: catId,
        name: name.trim(),
        slug: slug.trim().toUpperCase(),
        hsn: hsn || "5208",
        next_sequence: Number(nextSequence) || 1,
      }).select().single();

      if (error) throw error;
      return successResponse(res, { category: data }, "Category created successfully", 201);
    }

    return successResponse(res, { category: req.body }, "Category created locally", 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 6. GET ALL REGISTERED COLORS
export async function getColors(req, res) {
  try {
    let colors = getColorsFromStore();

    if (supabase) {
      try {
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "color_palette")
          .maybeSingle();

        if (data?.value && Array.isArray(data.value)) {
          colors = saveColorsToStore(data.value);
        }
      } catch (err) {
        console.warn("Supabase color_palette read notice:", err.message);
      }
    }

    return successResponse(res, { colors }, "Color palette retrieved successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 7. REGISTER NEW COLOR
export async function registerColor(req, res) {
  try {
    const { name, code } = req.body || {};
    if (!name || !String(name).trim()) {
      return errorResponse(res, "Color name is required", 400);
    }

    // Sync any existing Supabase colors first before adding the new one
    if (supabase) {
      try {
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "color_palette")
          .maybeSingle();

        if (data?.value && Array.isArray(data.value)) {
          saveColorsToStore(data.value);
        }
      } catch {
        // ignore
      }
    }

    const { color, colors } = saveColorToStore({ name, code });
    if (!color) {
      return errorResponse(res, "Invalid color name", 400);
    }

    if (supabase) {
      try {
        await supabase.from("settings").upsert({
          key: "color_palette",
          value: colors,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Supabase color_palette upsert notice:", err.message);
      }
    }

    invalidateCatalogCache();
    return successResponse(
      res,
      { color, colors },
      `Color "${color.name}" registered successfully`,
      201
    );
  } catch (err) {
    console.error("Register color error:", err);
    return errorResponse(res, err.message, 500);
  }
}

