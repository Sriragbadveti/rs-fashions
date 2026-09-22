import { API_BASE } from "../config/api";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  authProvider?: "email" | "google";
  loggedInAt: string;
  lastActiveAt: string;
  status?: "active" | "inactive";
  city?: string;
  address?: string;
  preferredWeave?: string;
  anniversary?: string;
  birthday?: string;
}

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  tag: "Home" | "Work" | "Other";
  isDefault: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedPayment {
  id: string;
  type: "card" | "upi";
  title: string;
  details: string;
  expiry?: string;
  isDefault: boolean;
}

export const USER_SESSION_KEY = "rs_fashions_current_user";
export const ADMIN_SESSION_KEY = "rs_admin_session";
export const USER_SESSION_EVENT = "rs_user_session_changed";
export const DEVICE_UUID_KEY = "rs_device_uuid_v2";

// 30 Days in Milliseconds: 30 * 24 * 60 * 60 * 1000 = 2,592,000,000 ms
export const INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;

export function getDeviceUUID(): string {
  try {
    let uuid = localStorage.getItem(DEVICE_UUID_KEY);
    if (!uuid) {
      const platformCode = typeof navigator !== "undefined" && /mac/i.test(navigator.userAgent) ? "mac" : "win";
      const randomHex = Math.random().toString(16).slice(2, 6) + "-" + Math.random().toString(16).slice(2, 6);
      uuid = `${randomHex}-${platformCode}-${Date.now().toString().slice(-4)}`;
      localStorage.setItem(DEVICE_UUID_KEY, uuid);
    }
    return uuid;
  } catch {
    return `dev-${Date.now().toString(36)}`;
  }
}

export function getDeviceMetadata(): { deviceName: string; platform: string; userAgent: string } {
  if (typeof navigator === "undefined") {
    return { deviceName: "Web Terminal", platform: "windows", userAgent: "" };
  }
  const ua = navigator.userAgent;
  let platform = "windows";
  let deviceName = "Billing Terminal (Web)";

  if (/mac/i.test(ua)) {
    platform = "macos";
    deviceName = "MacBook Pro / iMac";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    platform = "ios";
    deviceName = /ipad/i.test(ua) ? "Showroom iPad Terminal" : "iPhone Mobile Counter";
  } else if (/android/i.test(ua)) {
    platform = "android";
    deviceName = "Android POS Terminal";
  } else if (/windows/i.test(ua)) {
    platform = "windows";
    deviceName = "Showroom PC Terminal (Windows)";
  } else if (/linux/i.test(ua)) {
    platform = "linux";
    deviceName = "Linux Workstation";
  }

  return { deviceName, platform, userAgent: ua };
}

export async function syncDeviceSessionToBackend(session: UserSession): Promise<void> {
  try {
    const sessionId = getDeviceUUID();
    const meta = getDeviceMetadata();

    await fetch(`${API_BASE}/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        userId: session.id,
        userName: session.name,
        userEmail: session.email,
        role: session.role,
        deviceName: `${meta.deviceName} (${session.name || "Counter Staff"})`,
        platform: meta.platform,
        userAgent: meta.userAgent,
      }),
    });
  } catch (err) {
    console.warn("[UserSession] Auth session registration note:", err);
  }
}

/**
 * Retrieve active user session.
 * Automatically checks 30-day inactivity window and logs out if expired.
 */
export const MASTER_ADDRESS_KEY = "rs_saved_addresses_master";

// Helper to mark customer as inactive in admin CRM when 30 days elapse without activity
function markCustomerInactive(email?: string, phone?: string): void {
  try {
    const raw = localStorage.getItem("rs_admin_customers");
    if (!raw) return;
    const customers = JSON.parse(raw);
    if (!Array.isArray(customers)) return;
    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    const cleanEmail = (email || "").toLowerCase().trim();

    const updated = customers.map((c: any) => {
      const matchPhone = cleanPhone && (c.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone;
      const matchEmail = cleanEmail && (c.email || "").toLowerCase().trim() === cleanEmail;
      if (matchPhone || matchEmail) {
        return { ...c, status: "inactive", lastActiveAt: c.lastActiveAt || new Date().toISOString() };
      }
      return c;
    });
    localStorage.setItem("rs_admin_customers", JSON.stringify(updated));
  } catch {}
}

// Helper to mark customer as active on login/action
function markCustomerActive(email?: string, phone?: string): void {
  try {
    const raw = localStorage.getItem("rs_admin_customers");
    if (!raw) return;
    const customers = JSON.parse(raw);
    if (!Array.isArray(customers)) return;
    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    const cleanEmail = (email || "").toLowerCase().trim();
    const now = new Date().toISOString();

    const updated = customers.map((c: any) => {
      const matchPhone = cleanPhone && (c.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone;
      const matchEmail = cleanEmail && (c.email || "").toLowerCase().trim() === cleanEmail;
      if (matchPhone || matchEmail) {
        return { ...c, status: "active", lastActiveAt: now };
      }
      return c;
    });
    localStorage.setItem("rs_admin_customers", JSON.stringify(updated));
  } catch {}
}

/**
 * Retrieve active user session.
 * Automatically checks 30-day inactivity window:
 * If >30 days without login/activity, session transitions to inactive state in admin CRM.
 */
export function getUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;

    const session: UserSession = JSON.parse(raw);
    if (!session || !session.loggedInAt) return null;

    const lastActive = session.lastActiveAt
      ? new Date(session.lastActiveAt).getTime()
      : new Date(session.loggedInAt).getTime();

    const now = Date.now();
    // If inactive for > 30 days, transition data into inactive state in admin CRM
    if (now - lastActive > INACTIVITY_LIMIT_MS) {
      console.warn("[UserSession] 30 days inactive. User data preserved in Admin CRM as inactive type.");
      markCustomerInactive(session.email, session.phone);
      localStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(USER_SESSION_EVENT, { detail: null }));
      }
      return null;
    }

    return session;
  } catch (err) {
    console.error("[UserSession] Parse error:", err);
    return null;
  }
}

/**
 * Store user session upon successful login/registration.
 * Automatically reactivates customer account and merges any saved addresses.
 */
export function setUserSession(data: Partial<UserSession> & { name: string; email: string; phone: string }): UserSession {
  const now = new Date().toISOString();
  const session: UserSession = {
    id: data.id || `user-${Date.now().toString(36)}`,
    name: data.name,
    email: data.email.toLowerCase().trim(),
    phone: data.phone.trim(),
    role: data.role || "user",
    authProvider: data.authProvider || "email",
    loggedInAt: data.loggedInAt || now,
    lastActiveAt: now,
    status: "active",
    city: data.city || "Hyderabad",
    address: data.address || "",
    preferredWeave: data.preferredWeave,
    anniversary: data.anniversary,
    birthday: data.birthday,
  };

  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));

    // Reactivate patron status in admin CRM
    markCustomerActive(session.email, session.phone);

    // Also sync admin session if admin role
    if (session.role === "admin") {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        name: session.name,
        email: session.email,
        role: "Superadmin",
      }));
    }

    // Auto-migrate guest addresses into this patron's saved addresses
    try {
      const guestRaw = localStorage.getItem("rs_saved_addresses_guest");
      if (guestRaw) {
        const guestAddresses: SavedAddress[] = JSON.parse(guestRaw);
        if (Array.isArray(guestAddresses) && guestAddresses.length > 0) {
          guestAddresses.forEach((ga) => {
            saveAddress(
              {
                ...ga,
                name: ga.name || session.name,
                email: ga.email || session.email,
                phone: ga.phone || session.phone,
              },
              session.phone,
              session.email,
              session.id
            );
          });
        }
      }
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(USER_SESSION_EVENT, { detail: session }));
    }

    // Sync active session device to backend
    syncDeviceSessionToBackend(session);
  } catch (err) {
    console.error("[UserSession] Failed to persist session:", err);
  }

  return session;
}

/**
 * Update the user's activity timestamp to keep the 30-day window alive.
 */
export function touchUserSession(): void {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return;

    const session: UserSession = JSON.parse(raw);
    session.lastActiveAt = new Date().toISOString();
    session.status = "active";
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

/**
 * Logout and clear active session.
 * Note: Saved addresses, cards, and order history are NEVER deleted and persist safely for 30+ days.
 */
export function clearUserSession(): void {
  try {
    const sessionId = getDeviceUUID();
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);

    fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(USER_SESSION_EVENT, { detail: null }));
    }
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------------
// SAVED ADDRESSES (Multi-key + Master Persistence for 30+ Days)
// ----------------------------------------------------------------------

function getAddressStorageKey(userPhone?: string): string {
  const cleanPhone = (userPhone || "").replace(/\D/g, "").slice(-10);
  return cleanPhone ? `rs_addresses_${cleanPhone}` : "rs_saved_addresses_guest";
}

/**
 * Get all saved addresses for a user across phone, email, and master store.
 * Never loses addresses upon login.
 */
export function getSavedAddresses(userPhone?: string, userEmail?: string, userId?: string): SavedAddress[] {
  const results: SavedAddress[] = [];
  const seenIds = new Set<string>();

  // If no userPhone passed, try to get from current active session
  let phoneToUse = userPhone;
  let emailToUse = userEmail;
  if (!phoneToUse && !emailToUse) {
    try {
      const sessRaw = localStorage.getItem(USER_SESSION_KEY);
      if (sessRaw) {
        const sess = JSON.parse(sessRaw);
        if (sess?.phone) phoneToUse = sess.phone;
        if (sess?.email) emailToUse = sess.email;
      }
    } catch {}
  }

  const cleanPhone = (phoneToUse || "").replace(/\D/g, "").slice(-10);
  const cleanEmail = (emailToUse || "").toLowerCase().trim();

  // 1. Read from master address store
  try {
    const masterRaw = localStorage.getItem(MASTER_ADDRESS_KEY);
    if (masterRaw) {
      const list: SavedAddress[] = JSON.parse(masterRaw);
      if (Array.isArray(list)) {
        list.forEach((addr) => {
          const addrCleanPhone = (addr.phone || "").replace(/\D/g, "").slice(-10);
          const addrCleanEmail = (addr.email || "").toLowerCase().trim();
          const matchPhone = cleanPhone && addrCleanPhone === cleanPhone;
          const matchEmail = cleanEmail && addrCleanEmail === cleanEmail;
          const matchId = userId && addr.userId === userId;

          // If looking for a specific user, match phone/email/id; otherwise if guest, include guest addresses
          if (matchPhone || matchEmail || matchId || (!cleanPhone && !cleanEmail)) {
            if (!seenIds.has(addr.id)) {
              seenIds.add(addr.id);
              results.push(addr);
            }
          }
        });
      }
    }
  } catch {}

  // 2. Read from phone-specific key
  if (cleanPhone) {
    try {
      const phoneRaw = localStorage.getItem(`rs_addresses_${cleanPhone}`);
      if (phoneRaw) {
        const list: SavedAddress[] = JSON.parse(phoneRaw);
        if (Array.isArray(list)) {
          list.forEach((addr) => {
            if (!seenIds.has(addr.id)) {
              seenIds.add(addr.id);
              results.push(addr);
            }
          });
        }
      }
    } catch {}
  }

  // 3. Read from guest key if logged in user has no saved addresses yet
  if (results.length === 0) {
    try {
      const guestRaw = localStorage.getItem("rs_saved_addresses_guest");
      if (guestRaw) {
        const list: SavedAddress[] = JSON.parse(guestRaw);
        if (Array.isArray(list)) {
          list.forEach((addr) => {
            if (!seenIds.has(addr.id)) {
              seenIds.add(addr.id);
              results.push(addr);
            }
          });
        }
      }
    } catch {}
  }

  return results;
}

/**
 * Save an address with guaranteed persistence across logins and sessions for at least 30 days.
 */
export function saveAddress(
  addr: Omit<SavedAddress, "id"> & { id?: string; userId?: string },
  userPhone?: string,
  userEmail?: string,
  userId?: string
): SavedAddress[] {
  const id = addr.id || `addr-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  // Try to inherit from session if missing
  let phoneToUse = userPhone || addr.phone;
  let emailToUse = userEmail || addr.email;
  let idToUse = userId || addr.userId;

  if (!phoneToUse || !emailToUse) {
    try {
      const sessRaw = localStorage.getItem(USER_SESSION_KEY);
      if (sessRaw) {
        const sess = JSON.parse(sessRaw);
        if (!phoneToUse && sess?.phone) phoneToUse = sess.phone;
        if (!emailToUse && sess?.email) emailToUse = sess.email;
        if (!idToUse && sess?.id) idToUse = sess.id;
      }
    } catch {}
  }

  const existingList = getSavedAddresses(phoneToUse, emailToUse, idToUse);
  const isDefault = addr.isDefault ?? (existingList.length === 0);

  const updatedItem: SavedAddress = {
    ...addr,
    id,
    phone: addr.phone || phoneToUse || "",
    email: addr.email || emailToUse || "",
    userId: idToUse,
    isDefault,
    updatedAt: now,
    createdAt: (addr as any).createdAt || now,
  };

  // 1. Update master address store
  let masterList: SavedAddress[] = [];
  try {
    const rawMaster = localStorage.getItem(MASTER_ADDRESS_KEY);
    if (rawMaster) masterList = JSON.parse(rawMaster);
  } catch {}

  const masterIdx = masterList.findIndex((a) => a.id === id);
  if (masterIdx > -1) {
    masterList[masterIdx] = updatedItem;
  } else {
    masterList.unshift(updatedItem);
  }

  if (isDefault) {
    const cleanPhone = (phoneToUse || "").replace(/\D/g, "").slice(-10);
    const cleanEmail = (emailToUse || "").toLowerCase().trim();
    masterList = masterList.map((a) => {
      const matchPhone = cleanPhone && (a.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone;
      const matchEmail = cleanEmail && (a.email || "").toLowerCase().trim() === cleanEmail;
      if (matchPhone || matchEmail || a.id === id) {
        return { ...a, isDefault: a.id === id };
      }
      return a;
    });
  }

  try {
    localStorage.setItem(MASTER_ADDRESS_KEY, JSON.stringify(masterList));
  } catch {}

  // 2. Update phone-specific key
  const cleanPhone = (phoneToUse || "").replace(/\D/g, "").slice(-10);
  if (cleanPhone) {
    try {
      const phoneKey = `rs_addresses_${cleanPhone}`;
      const userList = masterList.filter(
        (a) => (a.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone ||
               (emailToUse && (a.email || "").toLowerCase() === emailToUse.toLowerCase())
      );
      localStorage.setItem(phoneKey, JSON.stringify(userList));
    } catch {}
  }

  // 3. Also update current session's primary address string if default
  if (isDefault) {
    try {
      const sessRaw = localStorage.getItem(USER_SESSION_KEY);
      if (sessRaw) {
        const sess = JSON.parse(sessRaw);
        sess.address = `${addr.address}, ${addr.apartment ? addr.apartment + ", " : ""}${addr.city}, ${addr.state} - ${addr.pincode}`;
        sess.city = addr.city;
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sess));
      }
    } catch {}
  }

  return getSavedAddresses(phoneToUse, emailToUse, idToUse);
}

export function deleteAddress(addressId: string, userPhone?: string, userEmail?: string): SavedAddress[] {
  try {
    const rawMaster = localStorage.getItem(MASTER_ADDRESS_KEY);
    if (rawMaster) {
      let masterList: SavedAddress[] = JSON.parse(rawMaster);
      masterList = masterList.filter((a) => a.id !== addressId);
      localStorage.setItem(MASTER_ADDRESS_KEY, JSON.stringify(masterList));
    }
  } catch {}

  const cleanPhone = (userPhone || "").replace(/\D/g, "").slice(-10);
  if (cleanPhone) {
    try {
      const key = `rs_addresses_${cleanPhone}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        let list: SavedAddress[] = JSON.parse(raw);
        list = list.filter((a) => a.id !== addressId);
        if (list.length > 0 && !list.some((a) => a.isDefault)) {
          list[0].isDefault = true;
        }
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch {}
  }

  return getSavedAddresses(userPhone, userEmail);
}

export function setDefaultAddress(addressId: string, userPhone?: string, userEmail?: string): SavedAddress[] {
  try {
    const rawMaster = localStorage.getItem(MASTER_ADDRESS_KEY);
    if (rawMaster) {
      let masterList: SavedAddress[] = JSON.parse(rawMaster);
      masterList = masterList.map((a) => ({
        ...a,
        isDefault: a.id === addressId,
      }));
      localStorage.setItem(MASTER_ADDRESS_KEY, JSON.stringify(masterList));
    }
  } catch {}

  const cleanPhone = (userPhone || "").replace(/\D/g, "").slice(-10);
  if (cleanPhone) {
    try {
      const key = `rs_addresses_${cleanPhone}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        let list: SavedAddress[] = JSON.parse(raw);
        list = list.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }));
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch {}
  }

  return getSavedAddresses(userPhone, userEmail);
}

// ----------------------------------------------------------------------
// SAVED PAYMENT METHODS
// ----------------------------------------------------------------------

function getPaymentStorageKey(userPhone?: string): string {
  const cleanPhone = (userPhone || "").replace(/\D/g, "").slice(-10);
  return cleanPhone ? `rs_payments_${cleanPhone}` : "rs_saved_payments_guest";
}

export function getSavedPayments(userPhone?: string): SavedPayment[] {
  try {
    const key = getPaymentStorageKey(userPhone);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePaymentMethod(payment: Omit<SavedPayment, "id"> & { id?: string }, userPhone?: string): SavedPayment[] {
  const list = getSavedPayments(userPhone);
  const id = payment.id || `pay-${Date.now().toString(36)}`;
  const isDefault = payment.isDefault ?? (list.length === 0);

  const updatedItem: SavedPayment = {
    ...payment,
    id,
    isDefault,
  };

  let updatedList: SavedPayment[];
  const existingIdx = list.findIndex((p) => p.id === id);

  if (existingIdx > -1) {
    updatedList = list.map((item, idx) => (idx === existingIdx ? updatedItem : item));
  } else {
    updatedList = [...list, updatedItem];
  }

  if (isDefault) {
    updatedList = updatedList.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
  }

  try {
    localStorage.setItem(getPaymentStorageKey(userPhone), JSON.stringify(updatedList));
  } catch {}

  return updatedList;
}

export function deletePaymentMethod(paymentId: string, userPhone?: string): SavedPayment[] {
  const list = getSavedPayments(userPhone);
  let updatedList = list.filter((p) => p.id !== paymentId);
  if (updatedList.length > 0 && !updatedList.some((p) => p.isDefault)) {
    updatedList[0].isDefault = true;
  }
  try {
    localStorage.setItem(getPaymentStorageKey(userPhone), JSON.stringify(updatedList));
  } catch {}
  return updatedList;
}

// ----------------------------------------------------------------------
// SLIDING ACTIVITY LISTENER (Auto-invoked in browser)
// ----------------------------------------------------------------------

if (typeof window !== "undefined") {
  let lastTouch = 0;
  const touchThrottleMs = 5 * 60 * 1000; // Throttle touch to once per 5 minutes

  const handleUserActivity = () => {
    const now = Date.now();
    if (now - lastTouch > touchThrottleMs) {
      lastTouch = now;
      touchUserSession();
    }
  };

  window.addEventListener("click", handleUserActivity, { passive: true });
  window.addEventListener("keydown", handleUserActivity, { passive: true });
}
