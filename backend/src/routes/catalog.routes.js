import { Router } from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  batchDeleteProducts,
  getCategories,
  createCategory,
  getColors,
  registerColor,
} from "../controllers/catalog.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const router = Router();

// Color Palette Endpoints
router.get("/colors", getColors);
router.post("/colors", requireAdminAuth, registerColor);

// Categories Endpoints
router.get("/categories", getCategories);
router.post("/categories", requireAdminAuth, createCategory);

// Products Endpoints (supports both /api/catalog and /api/catalog/products)
router.get("/", getProducts);
router.get("/products", getProducts);
router.post("/", requireAdminAuth, createProduct);
router.post("/products", requireAdminAuth, createProduct);
router.post("/batch-delete", requireAdminAuth, batchDeleteProducts);
router.post("/products/batch-delete", requireAdminAuth, batchDeleteProducts);
router.delete("/batch", requireAdminAuth, batchDeleteProducts);
router.delete("/products/batch", requireAdminAuth, batchDeleteProducts);
router.put("/:id", requireAdminAuth, updateProduct);
router.put("/products/:id", requireAdminAuth, updateProduct);
router.delete("/:id", requireAdminAuth, deleteProduct);
router.delete("/products/:id", requireAdminAuth, deleteProduct);

export default router;

