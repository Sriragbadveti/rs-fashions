import { Router } from "express";
import {
  getTransactions,
  getCustomerOrders,
  processRefund,
  getAnalyticsSummary,
  updateFulfillment,
} from "../controllers/sales.controller.js";

const router = Router();

router.get("/", getTransactions);
router.get("/customer-orders", getCustomerOrders);
router.get("/orders", getCustomerOrders);
router.get("/transactions", getTransactions);
router.post("/refund", processRefund);
router.get("/analytics/summary", getAnalyticsSummary);
router.put("/:invoiceNumber/fulfillment", updateFulfillment);

export default router;

