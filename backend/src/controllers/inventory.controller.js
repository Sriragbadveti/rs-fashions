import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { invalidateCatalogCache } from "./catalog.controller.js";
import { uploadImageToSupabaseStorage } from "./upload.controller.js";

/**
 * Controller: Stock Movements Audit Trail, Bulk Loom Intake & Low Stock Alerts
 */

// 1. GET ALL STOCK MOVEMENTS
export async function getMovements(req, res) {
  try {
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
      return successResponse(res, { movement: data }, "Stock movement logged successfully", 201);
    }

    return successResponse(res, { movement: req.body }, "Stock movement recorded locally", 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 3. BULK LOOM INTAKE
export async function handleBulkIntake(req, res) {
  try {
    const { products = [], performer = "Store Manager", loomPartner = "Master Weaver Guild" } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return errorResponse(res, "At least one product is required for bulk intake", 400);
    }

    const insertedProducts = [];
    const insertedMovements = [];

    if (supabase) {
      for (const p of products) {
        const prodId = p.id || `RSF-${(p.designSlug || 'BULK').toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const priceVal = Math.max(0, Number(p.salePrice || p.price) || 0);
        const origPriceVal = p.originalPrice ? Number(p.originalPrice) : Math.round(priceVal * 1.25);
        const stockTotal = Number(p.stock) || (p.variants ? p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : 1);
        const colorList = p.colors || (p.variants ? p.variants.map((v) => v.color) : ["Standard"]);
        let images = p.images || (p.imageUrl ? [p.imageUrl] : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"]);

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

        const { data: prodData } = await supabase.from("products").upsert({
          id: prodId,
          name: p.name,
          category: p.category || "SiCo Gadwal Sarees",
          material: p.material || "Silk Cotton (SiCo)",
          price: priceVal,
          original_price: origPriceVal,
          stock: stockTotal,
          images,
          colors: colorList,
          tags: p.tags || ["bulk-intake", "loom-arrival"],
          description: p.description || `Bulk loom intake for ${p.name}.`,
          updated_at: new Date().toISOString(),
        }).select().single();

        if (prodData) insertedProducts.push(prodData);

        // Movement record
        const { data: movData } = await supabase.from("stock_movements").insert([{
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

        if (movData) insertedMovements.push(movData);
      }

      invalidateCatalogCache();
      return successResponse(res, {
        count: insertedProducts.length,
        products: insertedProducts,
        movements: insertedMovements,
      }, `Successfully ingested ${insertedProducts.length} sarees into admin vault!`, 201);
    }

    invalidateCatalogCache();
    return successResponse(res, { count: products.length }, "Bulk intake recorded locally", 201);
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
