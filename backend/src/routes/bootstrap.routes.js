import { Router } from "express";
import { getBootstrapData } from "../controllers/bootstrap.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const router = Router();

// Single-Shot Initial Admin Data Hydration - Strictly Protected
router.get("/bootstrap", requireAdminAuth, getBootstrapData);

export default router;
