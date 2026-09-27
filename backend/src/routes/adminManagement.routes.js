import { Router } from "express";
import {
  getAdminsList,
  createNewAdmin,
  removeAdmin,
} from "../controllers/auth.controller.js";

const router = Router();

// Protected Multi-Admin Management Endpoints (Requires valid admin JWT)
router.get("/", getAdminsList);
router.post("/", createNewAdmin);
router.delete("/:id", removeAdmin);

export default router;
