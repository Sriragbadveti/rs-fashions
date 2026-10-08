import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { invalidateCatalogCache } from "./catalog.controller.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";
import { saveOrderToStore, getNextSequentialInvoiceNumberFromStore } from "../database/localStore.js";
import { createPendingOrder } from "../services/onlineOrders.js";
import { findExistingCustomer, phoneKey } from "../services/customerIdentity.js";
import { peekNextOrderNumber } from "../services/orderNumber.js";
import { deductStockForOrderItems, findStockShortages, holdStock, releaseHolds, withStockLock } from "../services/inventory.service.js";
import { isOnlineGatewayMethod } from "../services/orderVisibility.js";
import { claimPendingSale, unclaimPendingSale } from "../services/paymentStore.js";

/**
 * Controller: POS Billing, Counter Invoicing & Coupons
 */

async function resolveSequentialInvoiceNumber(providedInvoice, providedOrder) {
  const candidate = (providedInvoice || providedOrder || "").toString().trim();
  if (candidate) {
    if (/^\d+$/.test(candidate)) {
      return candidate.padStart(3, "0");
    }
    return candidate;
  }

  return peekNextOrderNumber();
}


// The stock check and the deduction must run one-at-a-time, so two customers racing for the last
// saree can't both succeed. The winner's session holds are released once the order is saved.
export function handleCheckout(req, res) {
  const sessionId = req.body?.session_id || req.body?.sessionId;
  return withStockLock(async () => {
    await handleCheckoutUnlocked(req, res);
    if (res.statusCode < 300) releaseHolds(sessionId);
  });
}

function stockShortageResponse(res, shortages) {
  const lines = shortages.map((s) =>
    s.available <= 0
      ? `"${s.name}" is out of stock`
      : `"${s.name}": only ${s.available} available (you asked for ${s.requested})`
  );
  return res.status(409).json({
    success: false,
    code: "INSUFFICIENT_STOCK",
    message: `Not enough stock: ${lines.join("; ")}.`,
    shortages,
  });
}

// 1. ATOMIC CHECKOUT
async function handleCheckoutUnlocked(req, res) {
  // Set below when this request claims a Razorpay payment-link cart (released again on failure).
  let linkOrderId = null;
  let claimedLinkSale = false;
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
      orderStatus = req.body.orderStatus || req.body.order_status || "ordered",
      billingType = req.body.billingType || req.body.billType || "gst",
      notes,
    } = req.body;

    const effectivePhone = customerPhone || req.body.phone || req.body.customer_phone;
    const effectiveName = customerName || req.body.customer_name || "Guest Customer";
    const effectiveEmail = customerEmail || req.body.email || req.body.customer_email || null;
    // The counter sends the address inside `customer` (and the storefront as shipping_address): take whichever is filled.
    const pickAddress = (...cands) => {
      for (const c of cands) {
        if (typeof c === "string" && c.trim()) return c.trim();
        if (c && typeof c === "object") return c;
      }
      return null;
    };
    const effectiveAddress = pickAddress(
      req.body.shipping_address,
      req.body.shippingAddress,
      req.body.address,
      req.body.customerAddress,
      req.body.customer?.address
    );

    if (String(paymentMethod).toLowerCase() === "cod") {
      return errorResponse(res, "Cash on Delivery is no longer available. Please pay online.", 400);
    }

    if (!effectivePhone || items.length === 0) {
      return errorResponse(res, "Customer phone and at least one item are required", 400);
    }

    if (!effectiveAddress) {
      console.warn(`[Billing] Sale for ${effectivePhone} arrived without an address (keys: ${Object.keys(req.body || {}).join(",")})`);
    }

    const saleId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    let finalInvoiceNumber = await resolveSequentialInvoiceNumber(invoiceNumber, orderNumber);

    // A counter sale paid through a Razorpay payment link is ALSO recorded by the server the
    // moment the payment is confirmed (payments.controller autoRecordPosSale). Both sides claim
    // the same pending cart, so exactly one of them records it (and deducts stock).
    linkOrderId = (() => {
      try {
        const id = new URL(String(req.body.paymentLink || "")).searchParams.get("order_id");
        return /^order_[A-Za-z0-9]+$/.test(id || "") ? id : null;
      } catch {
        return null;
      }
    })();
    const linkPaymentId = /^pay_[A-Za-z0-9]+$/.test(String(req.body.transactionId || "")) ? String(req.body.transactionId) : null;

    if (supabase) {
      if (linkOrderId) {
        claimedLinkSale = Boolean(await claimPendingSale(linkOrderId));
        if (!claimedLinkSale && linkPaymentId) {
          const { data: recorded } = await supabase
            .from("orders")
            .select("id, order_number, invoice_number, total, items")
            .ilike("notes", `%(${linkPaymentId})%`)
            .limit(1)
            .maybeSingle();
          if (recorded) {
            return successResponse(res, {
              saleId: recorded.id,
              invoiceNumber: recorded.invoice_number || recorded.order_number,
              order: recorded,
              alreadyRecorded: true,
            }, "Sale already recorded when the customer paid the link.");
          }
        }
      }

      // 0. Idempotency check: a retry of the SAME sale must not double-insert or double-deduct.
      // The counter picks its invoice number from the browser's own saved history, so it can
      // propose a number another order already owns (new browser/device, cleared storage, online
      // orders sharing the sequence). That is a different sale: give it the next free number
      // instead of silently dropping it (it used to be "already recorded": never saved, no stock
      // deducted, and gone after a refresh).
      const digits = (v) => String(v || "").replace(/\D/g, "").slice(-10);
      const itemSig = (list) =>
        (Array.isArray(list) ? list : [])
          .map((i) => `${i.sku || i.productId || i.id}:${String(i.color || i.selectedColor || "").toLowerCase()}:${Number(i.qty || i.quantity) || 1}`)
          .sort()
          .join("|");

      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id, order_number, invoice_number, phone, total, items")
          .or(`order_number.eq.${finalInvoiceNumber},invoice_number.eq.${finalInvoiceNumber}`)
          .limit(1)
          .maybeSingle();
        if (!existingOrder) break;

        const sameSale =
          digits(existingOrder.phone) === digits(effectivePhone) &&
          Math.abs((Number(existingOrder.total) || 0) - (Number(total) || 0)) < 0.5 &&
          itemSig(existingOrder.items) === itemSig(items);
        if (sameSale) {
          return successResponse(res, {
            saleId: existingOrder.id,
            invoiceNumber: existingOrder.invoice_number || existingOrder.order_number,
            order: existingOrder,
            alreadyRecorded: true,
          }, "Sale already recorded in database.");
        }
        finalInvoiceNumber = await peekNextOrderNumber();
      }

      // Reject orders for more pieces than are in stock (checked after the idempotency check so
      // retrying an already-recorded order isn't blocked by its own deduction).
      const shortages = await findStockShortages(items, { sessionId: req.body.session_id || req.body.sessionId });
      if (shortages.length > 0) return stockShortageResponse(res, shortages);

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
        order_status: orderStatus === "new" ? "ordered" : (orderStatus || "ordered"),
        billing_type: billingType,
        notes: notes || (linkPaymentId ? `Paid via Razorpay payment link (${linkPaymentId})` : null),
      }]).select().single();

      if (orderErr) throw orderErr;

      // 2. Decrement stock & record Stock Movement (Variant-aware & multi-source synchronized)
      await deductStockForOrderItems(items, {
        referenceNumber: finalInvoiceNumber,
        paymentMethod,
        performedBy: paymentMethod === "cod" ? "Online Storefront (COD)" : (isOnlineGatewayMethod(paymentMethod) ? "Online Storefront (Online Payment)" : "Showroom Billing Counter"),
        notePrefix: paymentMethod === "cod" ? "COD Order" : "Sale Invoice",
      });

      // 3. Upsert Customer Profile in CRM
      try {
        const existingCust = await findExistingCustomer({ phone: effectivePhone, email: effectiveEmail });
        const saleTotal = Number(total) || 0;

        if (existingCust) {
          const newSpent = (Number(existingCust.total_spent) || 0) + saleTotal;
          const newOrders = (Number(existingCust.orders_count) || 0) + 1;

          await supabase.from("customers").update({
            name: existingCust.name || effectiveName,
            ...(!existingCust.email && effectiveEmail ? { email: String(effectiveEmail).trim().toLowerCase() } : {}),
            ...(!phoneKey(existingCust.phone) && phoneKey(effectivePhone) ? { phone: phoneKey(effectivePhone) } : {}),
            // Keep the address from the counter on the customer card too (only fills a blank one).
            ...(typeof effectiveAddress === "string" && effectiveAddress && !String(existingCust.address || "").trim() ? { address: effectiveAddress } : {}),
            total_spent: newSpent,
            orders_count: newOrders,
            updated_at: new Date().toISOString(),
          }).eq("id", existingCust.id);
        } else {
          await supabase.from("customers").insert([{
            id: `cust-${Date.now().toString(36)}`,
            name: effectiveName || "Counter Guest",
            phone: effectivePhone,
            email: effectiveEmail || null,
            city: "Hyderabad",
            ...(typeof effectiveAddress === "string" && effectiveAddress ? { address: effectiveAddress } : {}),
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

    const localShortages = await findStockShortages(items, { sessionId: req.body.session_id || req.body.sessionId });
    if (localShortages.length > 0) return stockShortageResponse(res, localShortages);

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

    await deductStockForOrderItems(items, {
      referenceNumber: finalInvoiceNumber,
      paymentMethod,
      performedBy: paymentMethod === "cod" ? "Online Storefront (COD)" : (isOnlineGatewayMethod(paymentMethod) ? "Online Storefront (Online Payment)" : "Showroom Billing Counter"),
      notePrefix: paymentMethod === "cod" ? "COD Order" : "Sale Invoice",
    });

    invalidateCatalogCache();
    invalidateBootstrapCache();
    return successResponse(res, { sale: localSaved, invoiceNumber: finalInvoiceNumber }, "Sale recorded locally", 201);
  } catch (err) {
    console.error("POS Checkout error:", err);
    // Not recorded after all: let the server-side recorder (or a retry) take the cart back.
    if (claimedLinkSale && linkOrderId) await unclaimPendingSale(linkOrderId).catch(() => {});
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

// 3. STOCK CHECK (used by checkout BEFORE the customer pays)
export async function checkStock(req, res) {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const sessionId = req.body?.sessionId;
    // With a sessionId the pieces are also reserved for this customer for 10 minutes.
    const shortages = sessionId ? await holdStock(items, String(sessionId)) : await findStockShortages(items);
    return successResponse(
      res,
      { available: shortages.length === 0, reserved: Boolean(sessionId) && shortages.length === 0, holdMinutes: 10, shortages },
      shortages.length === 0 ? "All items in stock" : "Some items exceed available stock"
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 4. PENDING ONLINE ORDER (created before the customer pays)
export async function createPendingOrderHandler(req, res) {
  try {
    const out = await createPendingOrder(req.body || {});
    return res.status(out.status).json(out.body);
  } catch (err) {
    console.error("Pending order error:", err);
    return errorResponse(res, "Could not create the order. Please try again.", 500);
  }
}

/** POST /billing/pending-order/abandon — customer closed the payment window: free their reservation. */
export async function abandonPendingOrderHandler(req, res) {
  const sessionId = req.body?.sessionId || req.body?.session_id;
  if (sessionId) releaseHolds(String(sessionId));
  return res.json({ success: true });
}
