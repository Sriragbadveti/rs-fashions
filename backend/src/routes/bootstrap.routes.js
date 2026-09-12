import { Router } from "express";
import { getBootstrapData } from "../controllers/bootstrap.controller.js";

const router = Router();

router.get("/bootstrap", getBootstrapData);

export default router;
