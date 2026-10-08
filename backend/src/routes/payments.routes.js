import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getPaymentStatus,
  createPaymentLink,
  handleWebhook,
} from "../controllers/payments.controller.js";

const router = Router();

// Razorpay Standard Web Checkout (mounted at /api/payments)
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/status/:razorpayOrderId", getPaymentStatus);
router.post("/create-payment-link", createPaymentLink);
router.post("/webhook", handleWebhook);

export default router;
