import { Router } from "express";
import { getFestivalOffer, quoteFestivalOffer, previewFestivalOffer } from "../controllers/festivalOffer.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";
import { handleCheckout, validateCoupon, checkStock, createPendingOrderHandler, abandonPendingOrderHandler } from "../controllers/billing.controller.js";

const router = Router();

// Atomic POS Counter Sale & Invoicing & Web Orders
router.post("/checkout", handleCheckout);
router.post("/orders", handleCheckout);
router.post("/sales", handleCheckout);

// Server-side order created before an online payment (finalised by webhook/verify)
router.post("/pending-order", createPendingOrderHandler);
router.post("/pending-order/abandon", abandonPendingOrderHandler);

// Pre-payment stock check
router.post("/check-stock", checkStock);

// Coupon Validator
router.get("/coupons/validate", validateCoupon);

// Festival Offer (server-side only; the storefront does not call these yet)
router.get("/festival-offer", getFestivalOffer);
router.post("/festival-offer/quote", quoteFestivalOffer);
router.post("/festival-offer/preview", requireAdminAuth, previewFestivalOffer);

export default router;
