import { Router } from "express";
import { getSettings, updateSetting } from "../controllers/settings.controller.js";

const router = Router();

router.get("/", getSettings);
router.get("/settings", getSettings);
router.put("/:key", updateSetting);
router.put("/settings/:key", updateSetting);

export default router;
