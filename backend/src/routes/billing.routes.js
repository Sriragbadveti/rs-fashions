import { Router } from "express";
import { handleCheckout, validateCoupon, checkStock } from "../controllers/billing.controller.js";

const router = Router();

// Atomic POS Counter Sale & Invoicing & Web Orders
router.post("/checkout", handleCheckout);
router.post("/orders", handleCheckout);
router.post("/sales", handleCheckout);

// Pre-payment stock check
router.post("/check-stock", checkStock);

// Coupon Validator
router.get("/coupons/validate", validateCoupon);

export default router;
