import { Router } from "express";
import {
  createCashfreeOrder,
  verifyCashfreePayment,
  createCashfreePaymentLink,
  handleCashfreeWebhook,
  finalizeCashfreeOrder,
  getPaymentStatus,
} from "../controllers/payments.controller.js";

const router = Router();

// Cashfree PG Routes
router.post("/cashfree/create-order", createCashfreeOrder);
router.post("/cashfree/verify", verifyCashfreePayment);
router.get("/cashfree/status/:orderId", getPaymentStatus);
router.post("/cashfree/create-payment-link", createCashfreePaymentLink);
router.post("/cashfree/webhook", handleCashfreeWebhook);
router.post("/cashfree/finalize", finalizeCashfreeOrder);

export default router;
