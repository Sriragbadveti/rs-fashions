import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { uploadImageToSupabaseStorage } from "./upload.controller.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";

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

export function invalidateCatalogCache() {
  cachedProducts = null;
  cachedCategories = null;
  lastProductsFetch = 0;
  lastCategoriesFetch = 0;
  invalidateBootstrapCache();
}

// 1. GET ALL PRODUCTS
export async function getProducts(req, res) {
  try {
    if (cachedProducts && Date.now() - lastProductsFetch < CACHE_TTL_MS) {
      return successResponse(res, { products: cachedProducts }, "Products retrieved successfully (cached)");
    }

    if (!supabase) return successResponse(res, { products: [] });

    if (!inFlightProductsPromise) {
      inFlightProductsPromise = (async () => {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const products = (data || []).map((p) => {
          const colorList = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ["Standard"];
          const stockTotal = Number(p.stock) || 0;
          const images = Array.isArray(p.images) && p.images.length > 0 
            ? p.images 
            : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"];

          const variants = colorList.map((col, idx) => ({
            color: col,
            colorSlug: col.slice(0, 3).toUpperCase(),
            stock: idx === 0 ? stockTotal : 0,
            sku: `${p.id}-${col.slice(0, 3).toUpperCase()}`,
          }));

          return {
            id: p.id,
            name: p.name,
            category: p.category || "SiCo Gadwal Sarees",
            categoryId: "c1",
            material: p.material || "SiCo",
            price: Number(p.price) || 0,
            originalPrice: Number(p.original_price) || Math.round((Number(p.price) || 0) * 1.25),
            stock: stockTotal,
            variants,
            images,
            imageUrl: images[0],
            colors: colorList,
            tags: Array.isArray(p.tags) ? p.tags : ["handloom", "sico"],
            description: p.description || `${p.name} - Handcrafted Gadwal saree.`,
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
    return successResponse(res, { products }, "Products retrieved successfully");
  } catch (err) {
    if (cachedProducts) {
      return successResponse(res, { products: cachedProducts }, "Products retrieved successfully (fallback)");
    }
    return errorResponse(res, err.message, 500);
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
export async function createProduct(req, res) {
  try {
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
        tags: Array.isArray(tags) ? tags : [],
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

      invalidateCatalogCache();
      return successResponse(res, { product: data }, "Saree catalogued successfully", 201);
    }

    invalidateCatalogCache();
    return successResponse(res, { product: req.body }, "Saree created locally", 201);
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

      if (error) throw error;

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

      invalidateCatalogCache();
      return successResponse(res, { product: data }, "Product updated successfully");
    }

    invalidateCatalogCache();
    return successResponse(res, { product: req.body }, "Product updated locally");
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
    }
    invalidateCatalogCache();
    return successResponse(res, { id }, "Product deleted successfully");
  } catch (err) {
    console.error("Delete product error:", err);
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
