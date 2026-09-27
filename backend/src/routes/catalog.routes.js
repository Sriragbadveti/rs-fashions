import { Router } from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  getColors,
  registerColor,
} from "../controllers/catalog.controller.js";

const router = Router();

// Color Palette Endpoints
router.get("/colors", getColors);
router.post("/colors", registerColor);

// Categories Endpoints
router.get("/categories", getCategories);
router.post("/categories", createCategory);

// Products Endpoints (supports both /api/catalog and /api/catalog/products)
router.get("/", getProducts);
router.get("/products", getProducts);
router.post("/", createProduct);
router.post("/products", createProduct);
router.put("/:id", updateProduct);
router.put("/products/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.delete("/products/:id", deleteProduct);

export default router;

