import { Router } from "express";
import {
  createPaymentLink,
  createRazorpayOrder,
  verifyRazorpaySignature,
  createPhonePeOrder,
} from "../controllers/payments.controller.js";

const router = Router();

// Razorpay Routes
router.post("/razorpay/create-payment-link", createPaymentLink);
router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpaySignature);

// PhonePe Routes
router.post("/phonepe/create-order", createPhonePeOrder);
router.post("/phonepe/initiate", createPhonePeOrder);
router.post("/phonepe/create-payment-link", createPhonePeOrder);

export default router;
