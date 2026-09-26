import crypto from "crypto";
import { errorResponse } from "../utils/response.js";
import { ENV } from "../config/env.js";

// Active in-memory revoked tokens blacklist for immediate invalidation upon logout
const revokedTokens = new Set();
const activeAdminSessions = new Map();

const AUTH_SECRET = process.env.ADMIN_JWT_SECRET || ENV.CASHFREE.SECRET_KEY || "rs_fashions_admin_secure_key_2026";

/**
 * Generate a cryptographically signed admin session token.
 */
export function generateAdminToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const claims = {
    ...payload,
    role: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    jti: `adm_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedClaims = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`${encodedHeader}.${encodedClaims}`)
    .digest("base64url");

  const token = `${encodedHeader}.${encodedClaims}.${signature}`;
  activeAdminSessions.set(claims.jti, {
    claims,
    createdAt: new Date().toISOString(),
  });

  return { token, claims };
}

/**
 * Invalidate an admin session token upon logout.
 */
export function revokeAdminToken(token) {
  if (!token) return;
  revokedTokens.add(token);
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      if (claims?.jti) {
        activeAdminSessions.delete(claims.jti);
      }
    }
  } catch {}
}

/**
 * Verify admin session token.
 */
export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return null;
  if (revokedTokens.has(token)) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedClaims, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`${encodedHeader}.${encodedClaims}`)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString());
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) return null;
    if (claims.role !== "admin") return null;
    return claims;
  } catch {
    return null;
  }
}

/**
 * Express Middleware: Require valid server-side admin authentication.
 */
export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["x-admin-token"];
  if (!authHeader) {
    return errorResponse(res, "Admin authentication required. Missing authorization token.", 401);
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : String(authHeader).trim();
  const claims = verifyAdminToken(token);

  if (!claims) {
    return errorResponse(res, "Invalid or expired admin session token. Access denied.", 401);
  }

  req.adminUser = claims;
  next();
}
