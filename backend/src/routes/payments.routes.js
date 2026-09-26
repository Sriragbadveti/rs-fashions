import { Router } from "express";
import {
  createCashfreeOrder,
  verifyCashfreePayment,
  createCashfreePaymentLink,
  handleCashfreeWebhook,
  getPaymentStatus,
} from "../controllers/payments.controller.js";

const router = Router();

// Cashfree PG Routes
router.post("/cashfree/create-order", createCashfreeOrder);
router.post("/cashfree/verify", verifyCashfreePayment);
router.get("/cashfree/status/:orderId", getPaymentStatus);
router.post("/cashfree/create-payment-link", createCashfreePaymentLink);
router.post("/cashfree/webhook", handleCashfreeWebhook);

export default router;
