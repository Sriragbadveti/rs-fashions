import { isVisibleOrder } from "../services/orderVisibility.js";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import {
  getProductsFromStore,
  getColorsFromStore,
  saveColorsToStore,
} from "../database/localStore.js";
import { resolveBorderColor } from "../services/productFields.js";

let bootstrapCache = null;
let bootstrapCacheTimestamp = 0;
const BOOTSTRAP_CACHE_TTL_MS = 15 * 1000; // 15 seconds short cache for near real-time reactivity

export function invalidateBootstrapCache() {
  bootstrapCache = null;
  bootstrapCacheTimestamp = 0;
}

/**
 * Controller: Bootstrap / Single-Shot Initial Data Hydration
 */
export async function getBootstrapData(req, res) {
  try {
    const isForceRefresh = req.query.refresh === "true";
    if (!isForceRefresh && bootstrapCache && (Date.now() - bootstrapCacheTimestamp < BOOTSTRAP_CACHE_TTL_MS)) {
      return successResponse(res, bootstrapCache, "Unified bootstrap data loaded (cached)");
    }

    if (!supabase) {
      const fallbackProducts = getProductsFromStore();
      return successResponse(res, {
        categories: [
          { id: "cat_sico_gadwal", name: "SiCo Gadwal Sarees", slug: "SICO-GADWAL", hsn: "5208", nextSequence: 1 },
        ],
        products: fallbackProducts,
        colors: getColorsFromStore(),
        stockMovements: [],
        sales: [],
        customers: [],
        trackedOrders: [],
        coupons: [],
        settings: {},
      });
    }

    const [
      catsRes,
      prodsRes,
      movsRes,
      ordersRes,
      custsRes,
      trackedRes,
      couponsRes,
      settingsRes,
    ] = await Promise.all([
      supabase.from("categories").select("*").order("name", { ascending: true }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("tracked_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("settings").select("*"),
    ]);

    const categories = (catsRes.data || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      hsn: c.hsn || "5208",
      nextSequence: Number(c.next_sequence) || 1,
    }));

    const persistentVariantsMap = (settingsRes.data || []).find((s) => s.key === "product_variants")?.value || {};
    const rawProds = prodsRes.data || [];

    const products = rawProds.map((p) => {
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
              })));

      const finalStock = pVariants.length > 0
        ? pVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : stockTotal;

      const tags = Array.isArray(p.tags) ? p.tags : [];
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
        categoryId: p.categoryId || p.category_id || "c1",
        material: p.material || "SiCo",
        // Stored loom cost wins; the 70% estimate is only for rows saved before purchase_price existed.
        purchasePrice: p.purchase_price !== null && p.purchase_price !== undefined
          ? Number(p.purchase_price) || 0
          : Number(p.purchasePrice) || Math.round(Number(p.price || p.salePrice) * 0.7) || 0,
        salePrice: Number(p.price || p.salePrice || p.sale_price) || 0,
        price: Number(p.price || p.salePrice || p.sale_price) || 0,
        originalPrice: p.original_price || p.originalPrice ? Number(p.original_price || p.originalPrice) : (Number(p.price || p.salePrice) * 1.25),
        stock: finalStock,
        variants: pVariants,
        images,
        imageUrl: images[0] || p.imageUrl || p.image_url,
        colors: colorList,
        tags,
        isSpecialOffer,
        isLimitedEdition,
        rating: Number(p.rating) || 4.8,
        reviewCount: Number(p.review_count) || 0,
        featured: Boolean(p.featured),
        borderColor: resolveBorderColor(p, colorList),
        description: p.description || "",
      };
    });

    const stockMovements = (movsRes.data || []).map((m) => ({
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

    const sales = (ordersRes.data || []).filter(isVisibleOrder).map((o) => {
      const normalizedItems = (Array.isArray(o.items) ? o.items : []).map((item, idx) => ({
        ...item,
        cartId: item.cartId || `item-${o.id}-${idx}`,
        id: item.id || item.productId || `prod-${idx}`,
        productId: item.productId || item.id,
        name: item.name || "SiCo Gadwal Saree",
        qty: Number(item.qty || item.quantity) || 1,
        quantity: Number(item.quantity || item.qty) || 1,
        unitPrice: Number(item.unitPrice || item.price) || 0,
        price: Number(item.price || item.unitPrice) || 0,
        sku: item.sku || item.id || `RSF-SR-${idx + 1}`,
        color: item.color || "Standard",
        colorSlug: item.colorSlug || "STD",
      }));

      const fullAddress = typeof o.shipping_address === "string"
        ? o.shipping_address
        : o.shipping_address && typeof o.shipping_address === "object"
          ? [
              o.shipping_address.address,
              o.shipping_address.apartment,
              o.shipping_address.city,
              o.shipping_address.state,
              o.shipping_address.pincode,
            ]
              .filter(Boolean)
              .join(", ")
          : "";

      return {
        id: o.id,
        invoiceNumber: o.invoice_number || o.order_number || o.id,
        orderNumber: o.order_number || o.invoice_number || o.id,
        date: o.created_at
          ? new Date(o.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Recent",
        createdAt: o.created_at,
        customerName: o.customer_name || "Guest Customer",
        customerPhone: o.phone || "",
        customerEmail: o.email || "",
        customer: {
          name: o.customer_name || "Guest Customer",
          phone: o.phone || "",
          email: o.email || "",
          address: fullAddress,
        },
        shippingAddress: fullAddress,
        items: normalizedItems,
        subtotal: Number(o.subtotal) || 0,
        cgst: Number(o.cgst) || 0,
        sgst: Number(o.sgst) || 0,
        discount: Number(o.discount_amount) || 0,
        total: Number(o.total) || 0,
        paymentMethod: o.payment_method || "upi",
        paymentStatus: o.payment_status || "completed",
        orderStatus: o.order_status === "new" ? "ordered" : (o.order_status || "ordered"),
        billType: o.billing_type || "gst",
      };
    });

    const customers = (custsRes.data || []).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || undefined,
      city: c.city || "Hyderabad",
      address: c.address || (c.city ? `${c.city}, Telangana` : "Hyderabad, Telangana"),
      totalSpent: Number(c.total_spent) || 0,
      ordersCount: Number(c.orders_count) || 0,
      birthday: c.birthday || undefined,
      anniversary: c.anniversary || undefined,
      preferredWeave: c.preferred_weave || undefined,
      notes: c.notes || undefined,
      gstin: c.gstin || undefined,
      authProvider: (c.notes && c.notes.toLowerCase().includes("google")) ? "google" : "email",
      joinedAt: c.created_at || c.updated_at || undefined,
    }));

    const trackedOrders = (trackedRes.data || []).map((t) => ({
      id: t.id,
      trackingNumber: t.tracking_number,
      direction: t.direction,
      title: t.title,
      partyName: t.party_name,
      partyContact: t.party_contact,
      location: t.location,
      skuList: Array.isArray(t.sku_list) ? t.sku_list : [],
      totalPieces: Number(t.total_pieces) || 1,
      totalValue: Number(t.total_value) || 0,
      courierOrLoomPartner: t.courier_or_loom_partner,
      currentStage: t.current_stage,
      estimatedCompletion: t.estimated_completion,
      lastUpdate: t.last_update,
      notes: t.notes || undefined,
      history: Array.isArray(t.history_timeline) ? t.history_timeline : [],
    }));

    const coupons = (couponsRes.data || []).map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value) || 0,
      minOrderValue: Number(c.min_order_value) || 0,
      maxUses: Number(c.max_uses) || 100,
      timesUsed: Number(c.times_used) || 0,
      isActive: Boolean(c.is_active),
      expiresAt: c.expires_at,
    }));

    const settings = {};
    (settingsRes.data || []).forEach((s) => {
      settings[s.key] = s.value;
    });

    const colors = Array.isArray(settings.color_palette)
      ? saveColorsToStore(settings.color_palette)
      : getColorsFromStore();

    const payload = {
      categories,
      products,
      colors,
      stockMovements,
      sales,
      customers,
      trackedOrders,
      coupons,
      settings,
    };

    bootstrapCache = payload;
    bootstrapCacheTimestamp = Date.now();

    return successResponse(res, payload, "Unified bootstrap data loaded successfully");
  } catch (err) {
    console.error("Bootstrap endpoint error:", err);
    return errorResponse(res, err.message, 500);
  }
}
