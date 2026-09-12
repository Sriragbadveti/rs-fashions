/**
 * Global API Base Configuration
 * In development / local testing: falls back to http://localhost:5001/api
 * In production (Vercel / deployed): uses VITE_API_BASE_URL from environment variables,
 * or defaults to relative /api if hosted together.
 */
const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "").trim();
const cleanUrl = envUrl.replace(/\/+$/, "");

export const API_BASE = cleanUrl
  ? (cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`)
  : (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? `${window.location.origin}/api`
      : "http://localhost:5001/api");

export const BACKEND_URL = cleanUrl || (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
  ? window.location.origin
  : "http://localhost:5001");
