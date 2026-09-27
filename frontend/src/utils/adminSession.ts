import { API_BASE } from "../config/api";

export interface AdminUser {
  name: string;
  email: string;
  role: "admin";
  sessionId?: string;
}

export interface AdminSessionData {
  token: string;
  user: AdminUser;
  savedAt: string;
}

const ADMIN_TAB_SESSION_KEY = "rs_admin_session_tab";

/**
 * Retrieve tab-isolated admin session from sessionStorage.
 * This guarantees that sessions are NOT leaked across windows or tabs.
 */
export function getAdminSession(): AdminSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_TAB_SESSION_KEY);
    if (!raw) return null;
    const parsed: AdminSessionData = JSON.parse(raw);
    if (parsed && parsed.token && parsed.user?.role === "admin") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get current admin bearer token for authorized API headers.
 */
export function getAdminToken(): string | null {
  const session = getAdminSession();
  return session ? session.token : null;
}

/**
 * Check whether the current browser tab is authenticated as admin.
 */
export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminToken());
}

/**
 * Persist admin session in sessionStorage for the current tab only.
 */
export function setAdminSession(token: string, user: AdminUser): void {
  if (typeof window === "undefined") return;
  try {
    const data: AdminSessionData = {
      token,
      user,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(ADMIN_TAB_SESSION_KEY, JSON.stringify(data));
    // Also remove any stale legacy localStorage admin session
    localStorage.removeItem("rs_admin_session");
  } catch (err) {
    console.warn("[AdminSession] Failed to set session in sessionStorage:", err);
  }
}

/**
 * Clear admin session from current tab and invalidate on backend.
 */
export async function clearAdminSession(): Promise<void> {
  if (typeof window === "undefined") return;
  const token = getAdminToken();

  try {
    sessionStorage.removeItem(ADMIN_TAB_SESSION_KEY);
    localStorage.removeItem("rs_admin_session");

    if (token) {
      await fetch(`${API_BASE}/auth/admin-logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("[AdminSession] Logout notice:", err);
  }
}

/**
 * Get standard headers including Authorization: Bearer <adminToken> if authenticated.
 */
export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Unified authenticated fetch for all admin endpoints.
 * Automatically injects Authorization: Bearer <token>.
 */
export async function adminFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const authHeaders = getAdminAuthHeaders();
  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders,
      ...(init.headers || {}),
    },
  });
}
