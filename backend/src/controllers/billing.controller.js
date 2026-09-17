import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { invalidateCatalogCache } from "./catalog.controller.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";
import { saveOrderToStore } from "../database/localStore.js";

/**
 * Controller: POS Billing, Counter Invoicing & Coupons
 */

// 1. ATOMIC CHECKOUT
export async function handleCheckout(req, res) {
  try {
    const {
      invoiceNumber,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      items = [],
      subtotal = 0,
      cgst = 0,
      sgst = 0,
      shippingFee = 0,
      discount = 0,
      couponCode,
      total = 0,
      paymentMethod = "cash",
      paymentStatus = "completed",
      orderStatus = "completed",
      billingType = req.body.billingType || req.body.billType || "gst",
      notes,
    } = req.body;

    const effectivePhone = customerPhone || req.body.phone || req.body.customer_phone;
    const effectiveName = customerName || req.body.customer_name || "Guest Customer";
    const effectiveEmail = customerEmail || req.body.email || req.body.customer_email || null;
    const effectiveAddress = req.body.shipping_address || req.body.address || null;

    if (!effectivePhone || items.length === 0) {
      return errorResponse(res, "Customer phone and at least one item are required", 400);
    }

    const saleId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const finalInvoiceNumber = invoiceNumber || orderNumber || `RSF-${Date.now().toString().slice(-6)}`;

    if (supabase) {
      // 1. Record order in orders table
      const { data: orderData, error: orderErr } = await supabase.from("orders").insert([{
        id: saleId,
        order_number: finalInvoiceNumber,
        invoice_number: finalInvoiceNumber,
        customer_name: effectiveName,
        phone: effectivePhone,
        email: effectiveEmail,
        shipping_address: effectiveAddress,
        items,
        subtotal: Number(subtotal) || 0,
        cgst: Number(cgst) || 0,
        sgst: Number(sgst) || 0,
        shipping_fee: Number(shippingFee) || 0,
        discount_amount: Number(discount) || 0,
        coupon_code: couponCode || null,
        total: Number(total) || 0,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        order_status: orderStatus,
        billing_type: billingType,
        notes: notes || null,
      }]).select().single();

      if (orderErr) throw orderErr;

      // 2. Decrement stock & record Stock Movement
      for (const item of items) {
        const prodId = item.productId || item.id || item.sku;
        const qtyToDeduct = Math.max(1, Number(item.qty || item.quantity) || 1);

        try {
          const { data: currentProd } = await supabase.from("products").select("stock, name, colors").eq("id", prodId).single();
          if (currentProd) {
            const previousStock = Number(currentProd.stock) || 0;
            const newStock = Math.max(0, previousStock - qtyToDeduct);
            await supabase.from("products").update({ stock: newStock }).eq("id", prodId);

            // Record SALE movement
            await supabase.from("stock_movements").insert([{
              id: `mov-${Date.now()}-${item.colorSlug || 'std'}`,
              date: new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              sku: item.sku || prodId,
              product_name: item.name || currentProd.name,
              color: item.color || (currentProd.colors && currentProd.colors[0]) || "Standard",
              color_slug: item.colorSlug || "STD",
              type: "SALE",
              quantity: -qtyToDeduct,
              previous_stock: previousStock,
              new_stock: newStock,
              reference_number: finalInvoiceNumber,
              performed_by: "Counter Cashier",
              note: `POS Sale Invoice #${finalInvoiceNumber} (${billingType.toUpperCase()})`,
            }]);
          }
        } catch (itemErr) {
          console.warn("Stock decrement notice:", itemErr.message);
        }
      }

      // 3. Upsert Customer Profile in CRM
      try {
        const { data: existingCust } = await supabase.from("customers").select("*").eq("phone", effectivePhone).maybeSingle();
        const saleTotal = Number(total) || 0;

        if (existingCust) {
          const newSpent = (Number(existingCust.total_spent) || 0) + saleTotal;
          const newOrders = (Number(existingCust.orders_count) || 0) + 1;

          await supabase.from("customers").update({
            name: effectiveName || existingCust.name,
            total_spent: newSpent,
            orders_count: newOrders,
            updated_at: new Date().toISOString(),
          }).eq("phone", effectivePhone);
        } else {
          await supabase.from("customers").insert([{
            id: `cust-${Date.now().toString(36)}`,
            name: effectiveName || "Counter Guest",
            phone: effectivePhone,
            email: effectiveEmail || null,
            city: "Hyderabad",
            total_spent: saleTotal,
            orders_count: 1,
          }]);
        }
      } catch (crmErr) {
        console.warn("Customer loyalty notice:", crmErr.message);
      }

      // Save to local persistence store for immediate customer lookup
      saveOrderToStore({
        ...orderData,
        invoiceNumber: finalInvoiceNumber,
        invoice_number: finalInvoiceNumber,
        customerName: effectiveName,
        customerPhone: effectivePhone,
        customerEmail: effectiveEmail,
        items,
        total,
      });

      // Invalidate both caches so the next admin refresh includes this sale and its movements.
      invalidateCatalogCache();
      invalidateBootstrapCache();

      return successResponse(res, {
        sale: orderData,
        invoiceNumber: finalInvoiceNumber,
      }, "Sale recorded and inventory synced successfully", 201);
    }

    const localSaved = saveOrderToStore({
      id: saleId,
      invoiceNumber: finalInvoiceNumber,
      invoice_number: finalInvoiceNumber,
      orderNumber: finalInvoiceNumber,
      order_number: finalInvoiceNumber,
      customerName: effectiveName,
      customerPhone: effectivePhone,
      customerEmail: effectiveEmail,
      shippingAddress: effectiveAddress,
      items,
      subtotal,
      cgst,
      sgst,
      shippingFee,
      discount,
      total,
      paymentMethod,
      paymentStatus,
      orderStatus,
      billingType,
      createdAt: new Date().toISOString(),
    });

    invalidateCatalogCache();
    invalidateBootstrapCache();
    return successResponse(res, { sale: localSaved, invoiceNumber: finalInvoiceNumber }, "Sale recorded locally", 201);
  } catch (err) {
    console.error("POS Checkout error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 2. VALIDATE COUPON
export async function validateCoupon(req, res) {
  try {
    const { code, amount = 0 } = req.query;
    if (!code) {
      return errorResponse(res, "Coupon code is required", 400);
    }

    const orderAmount = Number(amount) || 0;

    if (supabase) {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", String(code).trim())
        .single();

      if (error || !coupon) {
        return errorResponse(res, "Invalid or expired coupon code", 404);
      }

      if (!coupon.is_active) {
        return errorResponse(res, "This coupon is no longer active", 400);
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return errorResponse(res, "This coupon has expired", 400);
      }

      if (orderAmount < Number(coupon.min_order_value || 0)) {
        return errorResponse(res, `Minimum cart value of ₹${coupon.min_order_value} required to apply this coupon`, 400);
      }

      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = Math.round((orderAmount * Number(coupon.discount_value)) / 100);
      } else {
        discountAmount = Number(coupon.discount_value);
      }

      return successResponse(res, {
        valid: true,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
        discountAmount,
        finalAmount: Math.max(0, orderAmount - discountAmount),
      }, `Coupon '${coupon.code}' applied successfully!`);
    }

    return successResponse(res, { valid: false, message: "Coupons unavailable in offline mode" });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}
