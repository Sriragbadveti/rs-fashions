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

const router = Router();

router.get("/", getMovements);
router.get("/stock-history", getMovements);
router.get("/movements", getMovements);
router.post("/movements", createMovement);
router.post("/bulk-intake", handleBulkIntake);
router.get("/low-stock", getLowStockAlerts);
router.get("/colors", getColors);
router.post("/colors", registerColor);

export default router;

