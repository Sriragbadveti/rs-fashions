import { Router } from "express";

import bootstrapRoutes from "./bootstrap.routes.js";
import catalogRoutes from "./catalog.routes.js";
import billingRoutes from "./billing.routes.js";
import paymentsRoutes from "./payments.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import crmRoutes from "./crm.routes.js";
import trackingRoutes from "./tracking.routes.js";
import salesRoutes from "./sales.routes.js";
import settingsRoutes from "./settings.routes.js";
import uploadRoutes from "./upload.routes.js";

const apiRouter = Router();

// Single-Shot Hydration
apiRouter.use("/", bootstrapRoutes);
apiRouter.use("/admin", bootstrapRoutes);

// Saree Catalog & Categories
apiRouter.use("/catalog", catalogRoutes);
apiRouter.use("/admin", catalogRoutes);
apiRouter.use("/", catalogRoutes);

// Billing & Invoicing
apiRouter.use("/billing", billingRoutes);
apiRouter.use("/admin", billingRoutes);
apiRouter.use("/", billingRoutes);

// Payment Gateways
apiRouter.use("/payments", paymentsRoutes);

// Inventory & Audit Trail
apiRouter.use("/inventory", inventoryRoutes);
apiRouter.use("/admin", inventoryRoutes);
apiRouter.use("/", inventoryRoutes);

// CRM & Customers
apiRouter.use("/crm", crmRoutes);
apiRouter.use("/admin", crmRoutes);
apiRouter.use("/", crmRoutes);

// Loom & Courier Tracking
apiRouter.use("/tracking", trackingRoutes);
apiRouter.use("/admin", trackingRoutes);
apiRouter.use("/", trackingRoutes);

// Sales Ledger & Analytics
apiRouter.use("/sales", salesRoutes);
apiRouter.use("/admin", salesRoutes);
apiRouter.use("/", salesRoutes);

// Store Settings
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/admin", settingsRoutes);
apiRouter.use("/", settingsRoutes);

// File & Image Storage (Supabase 'sarees' bucket)
apiRouter.use("/upload", uploadRoutes);

export default apiRouter;
