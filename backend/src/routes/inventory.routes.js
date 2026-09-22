import { Router } from "express";
import {
  getMovements,
  createMovement,
  handleBulkIntake,
  getLowStockAlerts,
} from "../controllers/inventory.controller.js";

const router = Router();

router.get("/", getMovements);
router.get("/stock-history", getMovements);
router.get("/movements", getMovements);
router.post("/movements", createMovement);
router.post("/bulk-intake", handleBulkIntake);
router.get("/low-stock", getLowStockAlerts);

export default router;
