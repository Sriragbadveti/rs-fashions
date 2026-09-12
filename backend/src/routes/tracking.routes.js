import { Router } from "express";
import {
  getTrackedOrders,
  createTrackedOrder,
  advanceOrderStage,
  deleteTrackedOrder,
} from "../controllers/tracking.controller.js";

const router = Router();

router.get("/orders", getTrackedOrders);
router.post("/orders", createTrackedOrder);
router.patch("/orders/:id/advance-stage", advanceOrderStage);
router.delete("/orders/:id", deleteTrackedOrder);

export default router;
