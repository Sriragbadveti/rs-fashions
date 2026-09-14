import { Router } from "express";
import {
  getSettings,
  updateSetting,
  getSaleConfig,
  updateSaleConfig,
} from "../controllers/settings.controller.js";

const router = Router();

// Dedicated sale endpoints
router.get("/sale", getSaleConfig);
router.post("/sale", updateSaleConfig);
router.put("/sale", updateSaleConfig);

// General settings
router.get("/", getSettings);
router.get("/settings", getSettings);
router.put("/:key", updateSetting);
router.put("/settings/:key", updateSetting);

export default router;
