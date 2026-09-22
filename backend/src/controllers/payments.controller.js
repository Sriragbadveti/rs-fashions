import {
  createCashfreeOrder as createCFOrderService,
  getCashfreeOrder,
  getCashfreeOrderPayments,
  createCashfreePaymentLink as createCFLinkService,
  verifyCashfreeWebhookSignature,
} from "../services/cashfree.service.js";
import { supabase } from "../config/supabase.js";
import { ENV } from "../config/env.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";

/**
 * Controller: Cashfree Payments (PG v2023-08-01)
 */

// 1. CREATE CASHFREE PAYMENT ORDER (Session for Web & App Checkout)
export async function createCashfreeOrder(req, res) {
  try {
    const {
      amount,
      currency = "INR",
      customerName = "Valued Customer",
      customerPhone = "9999999999",
      customerEmail = "customer@rsfashions.in",
      customerId,
      orderNumber,
      orderNote = "RS Fashions Saree Order",
      returnUrl,
    } = req.body;

    const amountInRupees = Number(amount) || 0;
    if (amountInRupees <= 0) {
      return errorResponse(res, "Valid payment amount is required", 400);
    }

    const cleanPhone = String(customerPhone).replace(/[^0-9]/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return errorResponse(res, "Valid 10-digit customer phone number is required", 400);
    }

    const cfOrderId = orderNumber
      ? `RSF_${orderNumber.replace(/[^a-zA-Z0-9_-]/g, "")}_${Date.now().toString().slice(-4)}`
      : `RSF_CF_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const isBenchmarkMock = req.headers["x-benchmark-mock"] === "true" || process.env.CASHFREE_MOCK_BENCHMARK === "true";

    const cfOrder = await createCFOrderService({
      orderId: cfOrderId,
      orderAmount: amountInRupees,
      orderCurrency: currency,
      customerDetails: {
        customerId: customerId || `cust_${cleanPhone}`,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: cleanPhone,
      },
      orderMeta: {
        returnUrl: returnUrl || `${ENV.CLIENT_URL}/checkout?order_id=${cfOrderId}&status=cashfree_return`,
        notifyUrl: `${ENV.BACKEND_URL}/api/payments/cashfree/webhook`,
      },
      orderNote,
      orderTags: {
        source: "RS_Fashions_WebStore",
      },
      isMock: isBenchmarkMock,
    });

    return successResponse(
      res,
      {
        orderId: cfOrder.order_id || cfOrderId,
        paymentSessionId: cfOrder.payment_session_id,
        orderAmount: cfOrder.order_amount || amountInRupees,
        orderCurrency: cfOrder.order_currency || currency,
        orderStatus: cfOrder.order_status || "ACTIVE",
        environment: cfOrder.environment || ENV.CASHFREE.ENV,
      },
      "Cashfree payment order created successfully"
    );
  } catch (err) {
    console.error("[Cashfree Controller] Create Order Error:", err);
    return errorResponse(res, err.message || "Failed to create Cashfree order", 500);
  }
}

// 2. VERIFY CASHFREE PAYMENT STATUS (Server-Side Official Check)
export async function verifyCashfreePayment(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return errorResponse(res, "Missing orderId for Cashfree verification", 400);
    }

    // 1. Fetch Order & Payments from Cashfree API
    const orderData = await getCashfreeOrder(orderId);
    const payments = await getCashfreeOrderPayments(orderId);

    const isPaid =
      orderData.order_status === "PAID" ||
      payments.some(
        (p) => String(p.payment_status).toUpperCase() === "SUCCESS"
      );

    const successfulPayment = payments.find(
      (p) => String(p.payment_status).toUpperCase() === "SUCCESS"
    ) || payments[0] || {};

    const paymentId = successfulPayment.payment_id || `cf_pay_${Date.now()}`;
    const paymentMethod = successfulPayment.payment_group || "cashfree";

    // 2. If paid and Supabase is configured, ensure order record is updated
    if (isPaid && supabase) {
      try {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            payment_method: "cashfree",
            updated_at: new Date().toISOString(),
          })
          .or(`order_number.eq.${orderId},id.eq.${orderId}`);

        invalidateBootstrapCache();
      } catch (dbErr) {
        console.warn("[Cashfree Verify] DB update notice:", dbErr.message);
      }
    }

    return successResponse(
      res,
      {
        verified: isPaid,
        paid: isPaid,
        orderId,
        paymentId,
        orderStatus: orderData.order_status || (isPaid ? "PAID" : "ACTIVE"),
        paymentDetails: successfulPayment,
      },
      isPaid ? "Cashfree payment verified successfully" : "Payment not completed or pending"
    );
  } catch (err) {
    console.error("[Cashfree Controller] Verify Payment Error:", err);
    return errorResponse(res, err.message || "Failed to verify Cashfree payment", 500);
  }
}

// 3. CREATE CASHFREE PAYMENT LINK (For Counter POS Billing & WhatsApp Share)
export async function createCashfreePaymentLink(req, res) {
  try {
    const {
      amount,
      customerName = "Valued Customer",
      customerPhone = "9999999999",
      customerEmail = "customer@rsfashions.in",
      invoiceNumber = `RSF-${Date.now().toString().slice(-6)}`,
    } = req.body;

    const amountInRupees = Number(amount) || 0;
    if (amountInRupees <= 0) {
      return errorResponse(res, "Valid payment amount is required", 400);
    }

    const cleanPhone = String(customerPhone).replace(/[^0-9]/g, "").slice(-10);
    const linkId = `plink_${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "")}_${Date.now().toString().slice(-4)}`;

    const linkResult = await createCFLinkService({
      linkId,
      linkAmount: amountInRupees,
      linkPurpose: `RS Fashions Saree Billing #${invoiceNumber}`,
      customerDetails: {
        customerPhone: cleanPhone,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
      },
      linkNotify: {
        send_sms: true,
        send_email: Boolean(customerEmail && customerEmail.includes("@")),
      },
      linkMeta: {
        returnUrl: `${ENV.CLIENT_URL}/payment-success?invoice=${encodeURIComponent(invoiceNumber)}&link_id=${linkId}`,
      },
    });

    return successResponse(
      res,
      {
        paymentLink: linkResult.link_url,
        linkUrl: linkResult.link_url,
        paymentLinkId: linkResult.link_id || linkId,
        amount: amountInRupees,
        invoiceNumber,
        status: linkResult.link_status || "ACTIVE",
      },
      "Cashfree payment link generated successfully"
    );
  } catch (err) {
    console.error("[Cashfree Controller] Payment Link Error:", err);
    return errorResponse(res, err.message || "Failed to generate Cashfree payment link", 500);
  }
}

// 4. CASHFREE WEBHOOK HANDLER (Secure Asynchronous Notifications)
export async function handleCashfreeWebhook(req, res) {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    const isValid = verifyCashfreeWebhookSignature(req.body, timestamp, signature);
    if (!isValid) {
      console.warn("[Cashfree Webhook] Invalid webhook signature received.");
      return errorResponse(res, "Invalid webhook signature", 401);
    }

    const event = req.body;
    const eventType = event.type || event.event;
    const orderData = event.data?.order || {};
    const paymentData = event.data?.payment || {};

    const orderId = orderData.order_id || paymentData.order_id;
    const paymentStatus = paymentData.payment_status || orderData.order_status;

    if (orderId && String(paymentStatus).toUpperCase() === "SUCCESS" && supabase) {
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: "cashfree",
          updated_at: new Date().toISOString(),
        })
        .or(`order_number.eq.${orderId},id.eq.${orderId}`);

      invalidateBootstrapCache();
      console.log(`[Cashfree Webhook] Order ${orderId} marked as PAID via webhook event ${eventType}`);
    }

    return successResponse(res, { received: true }, "Webhook processed successfully");
  } catch (err) {
    console.error("[Cashfree Webhook Error]:", err);
    return errorResponse(res, err.message || "Webhook processing error", 500);
  }
}
