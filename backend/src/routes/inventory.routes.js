import { Router } from "express";
import {
  getMovements,
  createMovement,
  handleBulkIntake,
  getLowStockAlerts,
} from "../controllers/inventory.controller.js";
import {
  getColors,
  registerColor,
} from "../controllers/catalog.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const router = Router();

// Public Catalog Colors Lookup
router.get("/colors", getColors);

// Protected Admin Stock & Inventory Endpoints
router.get("/", requireAdminAuth, getMovements);
router.get("/stock-history", requireAdminAuth, getMovements);
router.get("/movements", requireAdminAuth, getMovements);
router.post("/movements", requireAdminAuth, createMovement);
router.post("/bulk-intake", requireAdminAuth, handleBulkIntake);
router.get("/low-stock", requireAdminAuth, getLowStockAlerts);
router.post("/colors", requireAdminAuth, registerColor);

export default router;
