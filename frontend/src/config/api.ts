/**
 * Global API Base Configuration
 * In development / local testing: falls back to http://localhost:5001/api
 * In production (Vercel / deployed): uses VITE_API_BASE_URL from environment variables,
 * with the deployed Render API as a safe production fallback.
 */
const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "").trim();
const cleanUrl = envUrl.replace(/\/+$/, "");
const isLocalhost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const defaultBackendUrl = isLocalhost ? "http://localhost:5001" : "https://rs-fashions.onrender.com";

export const API_BASE = cleanUrl
  ? (cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`)
  : `${defaultBackendUrl}/api`;

export const BACKEND_URL = cleanUrl || defaultBackendUrl;
