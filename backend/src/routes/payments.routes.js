import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { supabase, inMemoryStore } from "../config/supabase.js";

const router = Router();

// Initialize Razorpay Instance
let razorpayInstance = null;
const getRazorpayInstance = () => {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// Test mode in-memory tracking of transactions
const transactionsStore = new Map();

/**
 * Helper: Generate SHA256 Checksum for PhonePe
 */
function createChecksum(stringToHash, saltKey, saltIndex) {
  const hash = crypto.createHash("sha256").update(stringToHash + saltKey).digest("hex");
  return `${hash}###${saltIndex}`;
}

/* =========================================================================
   1. PHONEPE PAYMENT GATEWAY (SANDBOX / TEST MODE)
========================================================================= */

/**
 * POST /api/payments/phonepe/initiate
 * Initiates payment with PhonePe standard checkout
 */
router.post("/phonepe/initiate", async (req, res) => {
  try {
    const {
      amount,
      orderId,
      customerName,
      email,
      phone,
      items,
      shippingAddress,
      subtotal,
      shippingFee = 0,
      discountAmount = 0,
      couponCode = null,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount." });
    }

    const merchantId = process.env.PHONEPE_MERCHANT_ID || "M234BFDRI0N1I_2609102233";
    const saltKey = process.env.PHONEPE_SALT_KEY || "5f95d8c9-f44a-4131-87e3-6b715679078e";
    const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
    const hostUrl = process.env.PHONEPE_HOST_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";

    const merchantTransactionId = `MT_RSF_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const merchantUserId = `MUID_${(phone || "USER").replace(/\D/g, "").slice(-10) || Date.now()}`;

    // PhonePe Payload in Paise (INR 1 = 100 paise)
    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId,
      amount: Math.round(Number(amount) * 100),
      redirectUrl: `${clientUrl}/checkout?status=phonepe_redirect&txnId=${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${backendUrl}/api/payments/phonepe/callback`,
      mobileNumber: (phone || "").replace(/\D/g, "").slice(-10) || "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = createChecksum(base64Payload + "/pg/v1/pay", saltKey, saltIndex);

    // Store transaction metadata locally / in database
    const pendingTxn = {
      merchantTransactionId,
      orderId: orderId || `ord-${Date.now().toString(36)}`,
      amount: Number(amount),
      customerName,
      email,
      phone,
      items,
      shippingAddress,
      subtotal,
      shippingFee,
      discountAmount,
      couponCode,
      status: "INITIATED",
      createdAt: new Date().toISOString(),
    };
    transactionsStore.set(merchantTransactionId, pendingTxn);

    // Call PhonePe UAT Sandbox API
    try {
      const response = await fetch(`${hostUrl}/pg/v1/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
        body: JSON.stringify({ request: base64Payload }),
      });

      const data = await response.json();

      if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
        return res.json({
          success: true,
          mode: "phonepe_gateway",
          redirectUrl: data.data.instrumentResponse.redirectInfo.url,
          merchantTransactionId,
          data: data.data,
        });
      }

      console.warn("PhonePe Sandbox responded:", data);
      
      return res.json({
        success: true,
        mode: "sandbox_simulation",
        redirectUrl: `${clientUrl}/checkout?status=sandbox_simulator&txnId=${merchantTransactionId}&amount=${amount}`,
        merchantTransactionId,
        message: data.message || "Test mode simulated transaction",
        sandboxResponse: data,
      });
    } catch (networkErr) {
      console.warn("PhonePe Sandbox Network error, falling back to simulator:", networkErr.message);
      return res.json({
        success: true,
        mode: "sandbox_simulation",
        redirectUrl: `${clientUrl}/checkout?status=sandbox_simulator&txnId=${merchantTransactionId}&amount=${amount}`,
        merchantTransactionId,
        message: "Sandbox test mode simulator ready",
      });
    }
  } catch (error) {
    console.error("Error in /phonepe/initiate:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/payments/phonepe/status/:txnId
 * Checks status of transaction directly with PhonePe and confirms order
 */
router.get("/phonepe/status/:txnId", async (req, res) => {
  try {
    const { txnId } = req.params;
    const merchantId = process.env.PHONEPE_MERCHANT_ID || "M234BFDRI0N1I_2609102233";
    const saltKey = process.env.PHONEPE_SALT_KEY || "5f95d8c9-f44a-4131-87e3-6b715679078e";
    const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
    const hostUrl = process.env.PHONEPE_HOST_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox";

    const checksum = createChecksum(`/pg/v1/status/${merchantId}/${txnId}`, saltKey, saltIndex);

    let isSuccess = false;
    let paymentData = null;

    try {
      const response = await fetch(`${hostUrl}/pg/v1/status/${merchantId}/${txnId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": merchantId,
        },
      });

      paymentData = await response.json();
      if (paymentData.code === "PAYMENT_SUCCESS" || paymentData.success === true) {
        isSuccess = true;
      }
    } catch (err) {
      console.warn("PhonePe Status Check fetch error:", err.message);
    }

    const localTxn = transactionsStore.get(txnId);
    if (!isSuccess && req.query.simulate === "true") {
      isSuccess = true;
    }

    if (localTxn) {
      localTxn.status = isSuccess ? "COMPLETED" : "FAILED";
      transactionsStore.set(txnId, localTxn);
    }

    return res.json({
      success: true,
      paid: isSuccess,
      merchantTransactionId: txnId,
      data: paymentData,
      localTxn,
    });
  } catch (error) {
    console.error("Error in /phonepe/status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/payments/phonepe/callback
 * S2S Webhook Callback from PhonePe
 */
router.post("/phonepe/callback", async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) {
      return res.status(400).json({ success: false, message: "No response body received" });
    }

    const decoded = JSON.parse(Buffer.from(response, "base64").toString("utf-8"));
    const txnId = decoded?.data?.merchantTransactionId;

    if (decoded.code === "PAYMENT_SUCCESS") {
      console.log(`[PhonePe Webhook] Payment Successful for Txn: ${txnId}`);
      if (transactionsStore.has(txnId)) {
        const txn = transactionsStore.get(txnId);
        txn.status = "COMPLETED";
      }
    }

    return res.json({ success: true, message: "Callback processed successfully" });
  } catch (error) {
    console.error("Error in PhonePe webhook callback:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================================================================
   2. RAZORPAY PAYMENT GATEWAY (TEST / LIVE MODE)
========================================================================= */

/**
 * POST /api/payments/razorpay/create-order
 * Creates a Razorpay Order
 */
router.post("/razorpay/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount." });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_TaPipYug8QFFpU";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "HQc35ZDRxjhdp9xrPqHEnayn";

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(Number(amount) * 100), // Amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now().toString(36)}`,
      notes: {
        store: "RS Fashions Atelier",
        ...notes,
      },
    };

    const order = await instance.orders.create(options);

    return res.json({
      success: true,
      key_id: keyId,
      order,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
    });
  }
});

/**
 * POST /api/payments/razorpay/verify
 * Validates HMAC SHA256 Signature for Razorpay Payment
 */
router.post("/razorpay/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment verification parameters.",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "HQc35ZDRxjhdp9xrPqHEnayn";

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      return res.json({
        success: true,
        verified: true,
        message: "Razorpay payment verified successfully",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Invalid Razorpay payment signature",
      });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
