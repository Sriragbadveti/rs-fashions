import { Router } from "express";
import { uploadImage, convertHeicImage } from "../controllers/upload.controller.js";

const router = Router();

// Supabase Storage & Web Image Processing endpoints
router.post("/", uploadImage);
router.post("/image", uploadImage);
router.post("/supabase", uploadImage);
router.post("/convert-heic", convertHeicImage);
// Fallback alias for any legacy cloudinary references
router.post("/cloudinary", uploadImage);

export default router;

