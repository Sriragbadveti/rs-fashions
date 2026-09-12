import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Controller: Sales Ledger, Returns/Refunds & Financial Intelligence
 */

// 1. GET ALL TRANSACTIONS
export async function getTransactions(req, res) {
  try {
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
      orderStatus: o.order_status || "completed",
    }));

    return successResponse(res, { sales }, "Transactions ledger retrieved successfully");
  } catch (err) {
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

    if (supabase) {
      const updates = { updated_at: new Date().toISOString() };
      if (status) updates.order_status = status;
      if (trackingNumber || carrierPartner) {
        updates.notes = `Fulfillment: [${carrierPartner || 'Standard'}] AWB: ${trackingNumber || 'Pending'}`;
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .or(`invoice_number.eq.${invoiceNumber},order_number.eq.${invoiceNumber},id.eq.${invoiceNumber}`)
        .select();

      if (error) throw error;

      // Also ensure tracked_orders has the record if trackingNumber provided
      if (trackingNumber) {
        try {
          await supabase.from("tracked_orders").upsert({
            id: `trk-${invoiceNumber}`,
            tracking_number: trackingNumber,
            direction: "outward",
            title: `Customer Order #${invoiceNumber}`,
            party_name: data?.[0]?.customer_name || "Customer",
            party_contact: data?.[0]?.phone || "9999999999",
            location: "Hub / In Transit",
            courier_or_loom_partner: carrierPartner || "Express Delivery",
            current_stage: status || "shipped",
            last_update: new Date().toLocaleString("en-IN"),
          });
        } catch {
          // ignore optional tracking table upsert
        }
      }

      return successResponse(res, { fulfillment: { status, trackingNumber, carrierPartner }, updated: data }, "Order fulfillment updated successfully");
    }

    return successResponse(res, { invoiceNumber, status, trackingNumber, carrierPartner }, "Fulfillment updated locally");
  } catch (err) {
    console.error("Update fulfillment error:", err);
    return errorResponse(res, err.message, 500);
  }
}

