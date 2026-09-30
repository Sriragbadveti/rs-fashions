import { Router } from "express";
import multer from "multer";
import { uploadImage, uploadMultipleImages, convertHeicImage } from "../controllers/upload.controller.js";

const router = Router();

// Configure multer with memory storage (max 25MB per file to handle high-resolution saree photos)
const storage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max per file
    files: 20, // max 20 files in bulk
  },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    const name = (file.originalname || "").toLowerCase();
    const isImage =
      mime.startsWith("image/") ||
      mime === "application/octet-stream" ||
      /\.(jpe?g|png|webp|gif|avif|svg|bmp|heic|heif)$/i.test(name);

    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}`));
    }
  },
});

// Use uploadMiddleware.any() to seamlessly support both binary FormData and JSON payloads
const handleUpload = [uploadMiddleware.any(), uploadImage];

// Supabase Storage & Web Image Processing endpoints
router.post("/", ...handleUpload);
router.post("/image", ...handleUpload);
router.post("/multiple", [uploadMiddleware.any(), uploadMultipleImages]);
router.post("/supabase", ...handleUpload);
router.post("/convert-heic", [uploadMiddleware.any(), convertHeicImage]);
// Fallback alias for any legacy cloudinary references
router.post("/cloudinary", ...handleUpload);

export default router;
