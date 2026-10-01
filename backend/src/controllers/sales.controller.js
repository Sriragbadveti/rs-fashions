import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import {
  getOrdersFromStore,
  saveFulfillmentToStore,
  getFulfillmentFromStore,
} from "../database/localStore.js";

/**
 * Controller: Sales Ledger, Returns/Refunds & Financial Intelligence
 */

// In-memory micro-cache for sales transactions
let cachedSales = null;
let lastSalesFetch = 0;
const CACHE_TTL_MS = 60 * 1000;

export const CANONICAL_ORDER_STATUSES = new Set([
  "ordered",
  "packaging",
  "shipped",
  "delivered",
  "refused_by_user",
  "cancelled",
]);

export function invalidateSalesCache() {
  cachedSales = null;
  lastSalesFetch = 0;
}

// 1. GET ALL TRANSACTIONS
export async function getTransactions(req, res) {
  try {
    const now = Date.now();
    if (cachedSales && now - lastSalesFetch < CACHE_TTL_MS) {
      return successResponse(res, { sales: cachedSales }, "Transactions ledger retrieved successfully (cached)");
    }

    if (!supabase) return successResponse(res, { sales: [] });

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    const sales = (data || []).map((o) => ({
      id: o.id,
      invoiceNumber: o.invoice_number || o.order_number || o.id,
      date: new Date(o.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      customerName: o.customer_name,
      customerPhone: o.phone,
      items: Array.isArray(o.items) ? o.items : [],
      subtotal: Number(o.subtotal) || 0,
      cgst: Number(o.cgst) || 0,
      sgst: Number(o.sgst) || 0,
      discount: Number(o.discount_amount) || 0,
      total: Number(o.total) || 0,
      paymentMethod: o.payment_method,
      billType: o.billing_type || "gst",
      orderStatus: o.order_status === "new" ? "ordered" : (o.order_status || "ordered"),
    }));

    cachedSales = sales;
    lastSalesFetch = now;

    return successResponse(res, { sales }, "Transactions ledger retrieved successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 1.5 GET CUSTOMER ORDERS & LIVE SHIPMENT TRACKING
export function getCourierTrackingUrl(carrier, awb) {
  if (!awb) return null;
  const cleanAwb = encodeURIComponent(String(awb).trim());
  const c = String(carrier || "").toLowerCase();
  if (c.includes("bluedart") || c.includes("blue dart")) {
    return `https://www.bluedart.com/tracking?trackNumber=${cleanAwb}`;
  }
  if (c.includes("delhivery")) {
    return `https://www.delhivery.com/track/package/${cleanAwb}`;
  }
  if (c.includes("dtdc")) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?awbNo=${cleanAwb}`;
  }
  if (c.includes("post") || c.includes("india post") || c.includes("speed post")) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
  }
  if (c.includes("shadowfax")) {
    return `https://tracker.shadowfax.in/#/track?orderId=${cleanAwb}`;
  }
  if (c.includes("ekart")) {
    return `https://ekartlogistics.com/shipmenttrack/${cleanAwb}`;
  }
  if (c.includes("xpressbees") || c.includes("xpress")) {
    return `https://www.xpressbees.com/track?awb=${cleanAwb}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier || 'courier'} tracking ${cleanAwb}`)}`;
}

export async function getCustomerOrders(req, res) {
  try {
    const rawEmail = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
    const rawPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, "").slice(-10) : null;

    if (!rawEmail && !rawPhone) {
      return errorResponse(res, "User phone or email is required to retrieve orders", 400);
    }

    const localOrders = getOrdersFromStore(rawPhone, rawEmail) || [];

    let sbOrders = [];
    if (supabase) {
      try {
        let query = supabase.from("orders").select("*");
        if (rawPhone && rawEmail) {
          query = query.or(`phone.ilike.%${rawPhone}%,email.ilike.${rawEmail}`);
        } else if (rawPhone) {
          query = query.ilike("phone", `%${rawPhone}%`);
        } else if (rawEmail) {
          query = query.ilike("email", rawEmail);
        }

        const { data: ordersData, error: ordersErr } = await query.order("created_at", { ascending: false });
        if (!ordersErr && ordersData) {
          const invoiceNumbers = ordersData.map((o) => o.invoice_number || o.order_number || o.id).filter(Boolean);
          let trackedMap = {};

          if (invoiceNumbers.length > 0) {
            try {
              const { data: trkData } = await supabase
                .from("tracked_orders")
                .select("*")
                .in("id", invoiceNumbers.map((inv) => `trk-${inv}`));
              if (trkData) {
                trkData.forEach((t) => {
                  const cleanKey = t.id.replace(/^trk-/, "");
                  trackedMap[cleanKey] = t;
                });
              }
            } catch (tErr) {
              console.warn("Tracked orders join notice:", tErr.message);
            }
          }

          sbOrders = ordersData.map((o) => {
            const invNum = o.invoice_number || o.order_number || o.id;
            const tracked = trackedMap[invNum];
            const localFulfillment = getFulfillmentFromStore(invNum) || {};

            let awb = localFulfillment.trackingNumber !== undefined
              ? localFulfillment.trackingNumber
              : (tracked?.tracking_number || null);
            let carrier = localFulfillment.carrierPartner || tracked?.courier_or_loom_partner || null;

            if (!awb && typeof o.notes === "string" && o.notes.includes("AWB:")) {
              const match = o.notes.match(/\[(.*?)\]\s*AWB:\s*([^\s,]+)/i);
              if (match) {
                carrier = match[1];
                awb = match[2] !== "Pending" ? match[2] : null;
              }
            }

            const rawStatus = localFulfillment.status || o.order_status || "ordered";
            const effectiveStatus = rawStatus === "new" ? "ordered" : rawStatus;
            const trackingUrl = awb ? getCourierTrackingUrl(carrier, awb) : null;

            return {
              id: o.id,
              orderNumber: o.order_number || invNum,
              invoiceNumber: invNum,
              date: new Date(o.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              createdAt: o.created_at,
              customerName: o.customer_name,
              customerPhone: o.phone,
              customerEmail: o.email,
              shippingAddress: o.shipping_address,
              items: Array.isArray(o.items) ? o.items : [],
              subtotal: Number(o.subtotal) || 0,
              cgst: Number(o.cgst) || 0,
              sgst: Number(o.sgst) || 0,
              shippingFee: Number(o.shipping_fee) || 0,
              discount: Number(o.discount_amount) || 0,
              couponCode: o.coupon_code,
              total: Number(o.total) || 0,
              paymentMethod: o.payment_method,
              paymentStatus: o.payment_status || "completed",
              orderStatus: effectiveStatus,
              carrierPartner: carrier || "RS Fashions Express",
              awbNumber: awb,
              trackingUrl,
              currentStage: localFulfillment.status || tracked?.current_stage || effectiveStatus,
              historyTimeline: tracked?.history_timeline || [],
              notes: o.notes,
            };
          });
        }
      } catch (err) {
        console.warn("Supabase getCustomerOrders fallback to local store:", err.message);
      }
    }

    // Merge sbOrders and localOrders, avoiding duplicates by invoiceNumber
    const seen = new Set();
    const allOrders = [];

    for (const o of [...sbOrders, ...localOrders]) {
      const key = o.invoiceNumber || o.orderNumber || o.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        // Ensure fulfillment data is fresh
        const f = getFulfillmentFromStore(key);
        if (f) {
          if (f.status) o.orderStatus = f.status;
          if (f.trackingNumber) o.awbNumber = f.trackingNumber;
          if (f.carrierPartner) o.carrierPartner = f.carrierPartner;
          if (f.trackingUrl || o.awbNumber) {
            o.trackingUrl = f.trackingUrl || getCourierTrackingUrl(o.carrierPartner, o.awbNumber);
          }
          o.currentStage = f.status || o.currentStage;
        }
        allOrders.push(o);
      }
    }

    return successResponse(res, { orders: allOrders }, "Customer orders retrieved successfully");
  } catch (err) {
    console.error("getCustomerOrders error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 2. PROCESS RETURN / REFUND
export async function processRefund(req, res) {
  try {
    const {
      invoiceNumber,
      itemId,
      sku,
      quantity = 1,
      refundAmount = 0,
      reason = "Customer exchange/return",
      performedBy = "Store Manager",
    } = req.body;

    if (!invoiceNumber || !sku) {
      return errorResponse(res, "Invoice number and SKU are required for processing returns", 400);
    }

    if (supabase) {
      // 1. Restock item into products
      const { data: prod } = await supabase.from("products").select("stock, name, colors").eq("id", itemId || sku).single();
      if (prod) {
        const previousStock = Number(prod.stock) || 0;
        const newStock = previousStock + Number(quantity);
        await supabase.from("products").update({ stock: newStock }).eq("id", prod.id || sku);

        // 2. Log RETURN in stock movements
        await supabase.from("stock_movements").insert([{
          id: `mov-ret-${Date.now()}`,
          date: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          sku,
          product_name: prod.name,
          color: (prod.colors && prod.colors[0]) || "Standard",
          color_slug: "STD",
          type: "RETURN",
          quantity: Number(quantity),
          previous_stock: previousStock,
          new_stock: newStock,
          reference_number: `RET-${invoiceNumber}`,
          performed_by: performedBy,
          note: `Customer Return: ${reason} (Refund: ₹${refundAmount})`,
        }]);
      }

      return successResponse(res, { invoiceNumber, sku, refundAmount }, "Return processed and stock replenished successfully");
    }

    return successResponse(res, { invoiceNumber, sku }, "Return recorded locally");
  } catch (err) {
    console.error("Refund error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 3. ANALYTICS & FINANCIAL INTELLIGENCE SUMMARY
export async function getAnalyticsSummary(req, res) {
  try {
    if (!supabase) {
      return successResponse(res, {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalTaxes: 0,
        totalVaultPieces: 0,
        totalDesigns: 0,
      });
    }

    const [ordersRes, prodsRes] = await Promise.all([
      supabase.from("orders").select("total, cgst, sgst, items, created_at"),
      supabase.from("products").select("id, name, price, stock, category"),
    ]);

    const orders = ordersRes.data || [];
    const products = prodsRes.data || [];

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalTaxes = orders.reduce((sum, o) => sum + (Number(o.cgst) || 0) + (Number(o.sgst) || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return successResponse(res, {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalTaxes,
      totalVaultPieces: products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0),
      totalDesigns: products.length,
    }, "Analytics intelligence summary calculated");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 4. UPDATE ORDER FULFILLMENT & TRACKING
export async function updateFulfillment(req, res) {
  try {
    const { invoiceNumber } = req.params;
    const { status, trackingNumber, carrierPartner } = req.body;

    if (!invoiceNumber) {
      return errorResponse(res, "Invoice number is required", 400);
    }

    let targetStatus = undefined;
    if (status !== undefined) {
      const s = String(status).toLowerCase().trim();
      targetStatus = s === "new" ? "ordered" : (s === "refused" ? "refused_by_user" : s);
      const validStatuses = ["ordered", "packaging", "shipped", "delivered", "refused_by_user", "cancelled"];
      if (!validStatuses.includes(targetStatus)) {
        return errorResponse(res, `Invalid order status "${status}". Allowed values: ${validStatuses.join(", ")}`, 400);
      }
    }

    // Fetch existing order to inspect payment method and current status
    let existingOrder = null;
    let existingCarrier = null;
    let existingAwb = null;

    if (supabase) {
      try {
        const { data: ord } = await supabase
          .from("orders")
          .select("order_status, notes, customer_name, phone, payment_method")
          .or(`invoice_number.eq.${invoiceNumber},order_number.eq.${invoiceNumber},id.eq.${invoiceNumber}`)
          .maybeSingle();
        existingOrder = ord;
      } catch {}
    }

    if (!existingOrder) {
      const localOrders = getOrdersFromStore();
      existingOrder = localOrders.find((o) => (o.invoiceNumber || o.invoice_number || o.id) === invoiceNumber) || null;
    }

    if (existingOrder?.notes && existingOrder.notes.includes("AWB:")) {
      const match = existingOrder.notes.match(/\[(.*?)\]\s*AWB:\s*([^\s,]+)/i);
      if (match) {
        existingCarrier = match[1];
        existingAwb = match[2] !== "Pending" ? match[2] : null;
      }
    }

    const currentStatus = existingOrder?.order_status === "new" ? "ordered" : (existingOrder?.order_status || "ordered");
    const paymentMethod = String(existingOrder?.payment_method || existingOrder?.paymentMethod || "").toLowerCase().trim();

    // Enforce COD restriction for "refused_by_user"
    if (targetStatus === "refused_by_user") {
      if (paymentMethod !== "cod") {
        return errorResponse(
          res,
          "Refused by User status can only be assigned to Cash on Delivery (COD) orders",
          400
        );
      }
      if (currentStatus === "delivered" || currentStatus === "cancelled") {
        return errorResponse(
          res,
          `Cannot change status to Refused by User from ${currentStatus}`,
          400
        );
      }
    }

    // Enforce invalid transition rules
    if (currentStatus === "delivered" && targetStatus && targetStatus !== "delivered") {
      return errorResponse(res, "Cannot change order status once delivered", 400);
    }
    if (currentStatus === "cancelled" && targetStatus && targetStatus !== "cancelled") {
      return errorResponse(res, "Cannot change order status once cancelled", 400);
    }
    if (currentStatus === "refused_by_user" && (targetStatus === "packaging" || targetStatus === "shipped")) {
      return errorResponse(
        res,
        `Cannot change order status from Refused by User back to ${targetStatus}`,
        400
      );
    }

    const effectiveCarrier = carrierPartner !== undefined ? carrierPartner : (existingCarrier || "RS Fashions Express");
    const effectiveAwb = trackingNumber !== undefined ? trackingNumber : (existingAwb || "");

    const finalStatus = targetStatus !== undefined ? targetStatus : currentStatus;

    if (supabase) {
      const updates = { updated_at: new Date().toISOString() };
      if (targetStatus) updates.order_status = targetStatus;
      if (effectiveAwb || effectiveCarrier) {
        updates.notes = `Fulfillment: [${effectiveCarrier || 'Standard'}] AWB: ${effectiveAwb || 'Pending'}`;
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .or(`invoice_number.eq.${invoiceNumber},order_number.eq.${invoiceNumber},id.eq.${invoiceNumber}`)
        .select();

      if (error) {
        console.warn("Supabase orders table update warning:", error.message);
      }

      // Also ensure tracked_orders has the record if trackingNumber or carrier provided
      try {
        await supabase.from("tracked_orders").upsert({
          id: `trk-${invoiceNumber}`,
          tracking_number: effectiveAwb || "Pending",
          direction: "outward",
          title: `Customer Order #${invoiceNumber}`,
          party_name: data?.[0]?.customer_name || existingOrder?.customer_name || "Customer",
          party_contact: data?.[0]?.phone || existingOrder?.phone || "9999999999",
          location: finalStatus === "refused_by_user" ? "Returned / Refused" : (finalStatus === "delivered" ? "Delivered" : "Hub / In Transit"),
          courier_or_loom_partner: effectiveCarrier || "Express Delivery",
          current_stage: finalStatus,
          last_update: new Date().toLocaleString("en-IN"),
        });
      } catch (tErr) {
        // ignore optional tracking table upsert
      }

      const updatedFulfillment = saveFulfillmentToStore(invoiceNumber, {
        status: finalStatus,
        trackingNumber: effectiveAwb,
        carrierPartner: effectiveCarrier,
        trackingUrl: getCourierTrackingUrl(effectiveCarrier, effectiveAwb),
      });

      return successResponse(
        res,
        {
          fulfillment: updatedFulfillment,
          updated: data,
        },
        "Order fulfillment updated successfully"
      );
    }

    const localFulfillment = saveFulfillmentToStore(invoiceNumber, {
      status: finalStatus,
      trackingNumber: effectiveAwb,
      carrierPartner: effectiveCarrier,
      trackingUrl: getCourierTrackingUrl(effectiveCarrier, effectiveAwb),
    });

    return successResponse(
      res,
      {
        invoiceNumber,
        fulfillment: localFulfillment,
        status: localFulfillment.status,
        trackingNumber: localFulfillment.trackingNumber,
        carrierPartner: localFulfillment.carrierPartner,
        trackingUrl: localFulfillment.trackingUrl,
      },
      "Fulfillment updated locally and stored in system"
    );
  } catch (err) {
    console.error("Update fulfillment error:", err);
    return errorResponse(res, err.message, 500);
  }
}

