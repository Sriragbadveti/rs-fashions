import { Router } from "express";
import {
  getTransactions,
  getCustomerOrders,
  processRefund,
  getAnalyticsSummary,
  updateFulfillment,
  cancelOrder,
} from "../controllers/sales.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const router = Router();

// Public Customer Self-Service Order Lookup (restricted to user's phone/email)
router.get("/customer-orders", getCustomerOrders);
router.get("/orders", getCustomerOrders);

// Protected Admin Sales & Intelligence Endpoints
router.get("/", requireAdminAuth, getTransactions);
router.get("/transactions", requireAdminAuth, getTransactions);
router.post("/refund", requireAdminAuth, processRefund);
router.get("/analytics/summary", requireAdminAuth, getAnalyticsSummary);
router.put("/:invoiceNumber/fulfillment", requireAdminAuth, updateFulfillment);
router.post("/:invoiceNumber/cancel", requireAdminAuth, cancelOrder);

export default router;
