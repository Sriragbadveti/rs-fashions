import { Router } from "express";
import {
  registerSession,
  getActiveSessions,
  revokeSession,
  logoutSession,
  initiateGoogleAuth,
  handleGoogleCallback,
  verifyGoogleToken,
  adminLogin,
  adminLogout,
  verifyAdminSession,
  createAdminAuthorized,
} from "../controllers/auth.controller.js";

const router = Router();

// Admin Authentication (Cryptographic Session Isolation)
router.post("/admin-login", adminLogin);
router.post("/admin-logout", adminLogout);
router.get("/admin-verify", verifyAdminSession);
router.post("/admin-create-authorized", createAdminAuthorized);

// Google OAuth 2.0 routes
router.get("/google", initiateGoogleAuth);
router.get("/google/callback", handleGoogleCallback);
router.post("/google/verify", verifyGoogleToken);

// Active device session routes
router.post("/session", registerSession);
router.get("/sessions", getActiveSessions);
router.delete("/sessions/:sessionId", revokeSession);
router.post("/logout", logoutSession);

// Backward-compatible alias for devices
router.get("/devices", getActiveSessions);
router.delete("/devices/:sessionId", revokeSession);

export default router;
