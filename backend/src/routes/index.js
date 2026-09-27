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
import reviewsRoutes from "./reviews.routes.js";
import authRoutes from "./auth.routes.js";
import adminManagementRoutes from "./adminManagement.routes.js";
import { requireAdminAuth } from "../middleware/adminAuth.js";

const apiRouter = Router();

// Authentication & Device Sessions (Public verification and passkey login)
apiRouter.use("/auth", authRoutes);
apiRouter.use("/admin/auth", authRoutes);

// ==========================================
// PROTECTED ADMIN ROUTER SCOPE
// All routes under /admin/* require valid cryptographic server token
// ==========================================
const adminRouter = Router();
adminRouter.use(requireAdminAuth);

adminRouter.use("/bootstrap", bootstrapRoutes);
adminRouter.use("/catalog", catalogRoutes);
adminRouter.use("/billing", billingRoutes);
adminRouter.use("/inventory", inventoryRoutes);
adminRouter.use("/crm", crmRoutes);
adminRouter.use("/tracking", trackingRoutes);
adminRouter.use("/sales", salesRoutes);
adminRouter.use("/settings", settingsRoutes);
adminRouter.use("/reviews", reviewsRoutes);
adminRouter.use("/admins", adminManagementRoutes);

adminRouter.use("/", bootstrapRoutes);
adminRouter.use("/", catalogRoutes);
adminRouter.use("/", billingRoutes);
adminRouter.use("/", inventoryRoutes);
adminRouter.use("/", crmRoutes);
adminRouter.use("/", trackingRoutes);
adminRouter.use("/", salesRoutes);
adminRouter.use("/", settingsRoutes);
adminRouter.use("/", adminManagementRoutes);

apiRouter.use("/admin", adminRouter);

// ==========================================
// PUBLIC STOREFRONT & SHARED SERVICES
// ==========================================
apiRouter.use("/catalog", catalogRoutes);
apiRouter.use("/billing", billingRoutes);
apiRouter.use("/payments", paymentsRoutes);
apiRouter.use("/inventory", inventoryRoutes);
apiRouter.use("/crm", crmRoutes);
apiRouter.use("/tracking", trackingRoutes);
apiRouter.use("/sales", salesRoutes);
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/reviews", reviewsRoutes);
apiRouter.use("/upload", uploadRoutes);

// Backward-compatible storefront fallback mounts
apiRouter.use("/", catalogRoutes);
apiRouter.use("/", billingRoutes);
apiRouter.use("/", trackingRoutes);
apiRouter.use("/", settingsRoutes);

export default apiRouter;
