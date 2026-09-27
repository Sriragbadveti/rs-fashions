/**
 * Global API Base Configuration
 * In development / local testing: resolves to local backend.
 * In LAN testing (mobile on same Wi-Fi): resolves to the host machine IP so mobile never fails on "localhost".
 * In production (Vercel / deployed): uses VITE_API_BASE_URL or falls back to deployed Render API.
 */
const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "").trim();
const cleanUrl = envUrl.replace(/\/+$/, "");

const isBrowser = typeof window !== "undefined";
const hostname = isBrowser ? window.location.hostname : "";
const isLocalhost = ["localhost", "127.0.0.1"].includes(hostname);
const isLanIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.endsWith(".local");

let resolvedBackendUrl = "";

if (cleanUrl) {
  // If the env variable points to localhost, but the user is accessing via LAN on mobile:
  if (isLanIp && cleanUrl.includes("localhost")) {
    const portMatch = cleanUrl.match(/:(\d+)$/);
    const port = portMatch ? portMatch[1] : "5001";
    resolvedBackendUrl = `${isBrowser ? window.location.protocol : "http:"}//${hostname}:${port}`;
  } else {
    resolvedBackendUrl = cleanUrl;
  }
} else if (isLocalhost) {
  resolvedBackendUrl = "http://localhost:5001";
} else if (isLanIp) {
  resolvedBackendUrl = `${isBrowser ? window.location.protocol : "http:"}//${hostname}:5001`;
} else {
  // Unified production backend URL
  resolvedBackendUrl = "https://rs-fashions.onrender.com";
}

export const API_BASE = resolvedBackendUrl.endsWith("/api")
  ? resolvedBackendUrl
  : `${resolvedBackendUrl}/api`;

export const BACKEND_URL = resolvedBackendUrl;
