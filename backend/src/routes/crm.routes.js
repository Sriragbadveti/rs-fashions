import { Router } from "express";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  checkCustomerExists,
} from "../controllers/crm.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const router = Router();

// Public Patron Self-Registration & Verification
router.get("/check-exists", checkCustomerExists);
router.post("/", createCustomer);
router.post("/customers", createCustomer);

// Protected Admin CRM Access
router.get("/", requireAdminAuth, getCustomers);
router.get("/customers", requireAdminAuth, getCustomers);
router.put("/:id", requireAdminAuth, updateCustomer);
router.put("/customers/:id", requireAdminAuth, updateCustomer);
router.delete("/:id", requireAdminAuth, deleteCustomer);
router.delete("/customers/:id", requireAdminAuth, deleteCustomer);

export default router;
