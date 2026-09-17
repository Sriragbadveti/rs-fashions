import { Router } from "express";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  checkCustomerExists,
} from "../controllers/crm.controller.js";

const router = Router();

router.get("/check-exists", checkCustomerExists);
router.get("/", getCustomers);
router.get("/customers", getCustomers);
router.post("/", createCustomer);
router.post("/customers", createCustomer);
router.put("/:id", updateCustomer);
router.put("/customers/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.delete("/customers/:id", deleteCustomer);

export default router;
