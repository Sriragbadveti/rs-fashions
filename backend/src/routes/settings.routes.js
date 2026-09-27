import { Router } from "express";
import {
  getSettings,
  updateSetting,
  getSaleConfig,
  updateSaleConfig,
} from "../controllers/settings.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const router = Router();

// Public Sale Config for Storefront Banners
router.get("/sale", getSaleConfig);

// Protected Admin Settings Endpoints
router.post("/sale", requireAdminAuth, updateSaleConfig);
router.put("/sale", requireAdminAuth, updateSaleConfig);
router.get("/", requireAdminAuth, getSettings);
router.get("/settings", requireAdminAuth, getSettings);
router.put("/:key", requireAdminAuth, updateSetting);
router.put("/settings/:key", requireAdminAuth, updateSetting);

export default router;
