import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";

const router = Router();

// Supabase Storage upload endpoints
router.post("/", uploadImage);
router.post("/image", uploadImage);
router.post("/supabase", uploadImage);
// Fallback alias for any legacy cloudinary references
router.post("/cloudinary", uploadImage);

export default router;
