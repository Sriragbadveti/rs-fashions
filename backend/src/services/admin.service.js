import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_ADMINS_FILE = path.join(__dirname, "../database/data/admin_accounts.json");

// In-memory cache for authorized admins
let cachedAdmins = null;
let lastAdminFetch = 0;
const ADMIN_CACHE_TTL_MS = 5 * 1000; // 5-second cache for fast lookups

function ensureDataDir() {
  const dir = path.dirname(LOCAL_ADMINS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLocalAdmins() {
  try {
    ensureDataDir();
    if (fs.existsSync(LOCAL_ADMINS_FILE)) {
      const raw = fs.readFileSync(LOCAL_ADMINS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("[AdminService] Local file read warning:", err.message);
  }
  return [];
}

function writeLocalAdmins(admins) {
  try {
    ensureDataDir();
    fs.writeFileSync(LOCAL_ADMINS_FILE, JSON.stringify(admins, null, 2), "utf8");
  } catch (err) {
    console.error("[AdminService] Local file write error:", err.message);
  }
}

/**
 * Cryptographically hash a password using scrypt with a random 16-byte salt.
 */
export function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a valid non-empty string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a candidate password against a stored scrypt hash in constant time.
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== "string" || !storedHash.includes(":")) {
    return false;
  }
  try {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Build default primary administrator account.
 */
function buildDefaultPrimaryAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@rsfashions.in").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin2026";
  return {
    id: "admin-sindhuja-primary",
    name: "Sindhuja",
    email,
    passwordHash: hashPassword(password),
    role: "admin",
    isPrimary: true,
    createdBy: "system",
    createdAt: "2026-09-01T00:00:00.000Z",
    lastLoginAt: null,
  };
}

/**
 * Fetch all authorized administrator accounts from database or local backup.
 */
export async function getAuthorizedAdmins(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedAdmins && (now - lastAdminFetch < ADMIN_CACHE_TTL_MS)) {
    return cachedAdmins;
  }

  let admins = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "admin_accounts")
        .maybeSingle();

      if (!error && data?.value) {
        if (Array.isArray(data.value)) {
          admins = data.value;
        } else if (data.value && typeof data.value === "object" && Array.isArray(data.value.admins)) {
          admins = data.value.admins;
        }
      }
    } catch (err) {
      console.warn("[AdminService] Supabase fetch notice:", err.message);
    }
  }

  // Fallback to local store if Supabase returned nothing
  if (!admins || admins.length === 0) {
    admins = readLocalAdmins();
  }

  // If still empty, seed the initial primary admin account
  if (!admins || admins.length === 0) {
    const defaultPrimary = buildDefaultPrimaryAdmin();
    admins = [defaultPrimary];
    await saveAuthorizedAdmins(admins);
  } else {
    // Ensure primary admin always exists in the list
    const primaryEmail = (process.env.ADMIN_EMAIL || "admin@rsfashions.in").trim().toLowerCase();
    const hasPrimary = admins.some((a) => a.email.toLowerCase() === primaryEmail);
    if (!hasPrimary) {
      admins.unshift(buildDefaultPrimaryAdmin());
      await saveAuthorizedAdmins(admins);
    }
  }

  cachedAdmins = admins;
  lastAdminFetch = now;
  return admins;
}

/**
 * Persist administrator accounts to Supabase settings and local file backup.
 */
export async function saveAuthorizedAdmins(admins) {
  cachedAdmins = admins;
  lastAdminFetch = Date.now();

  writeLocalAdmins(admins);

  if (supabase) {
    try {
      await supabase
        .from("settings")
        .upsert(
          {
            key: "admin_accounts",
            value: admins,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
    } catch (err) {
      console.warn("[AdminService] Supabase save notice:", err.message);
    }
  }
}

/**
 * Authenticate administrator credentials against authorized accounts in the database.
 * Returns sanitized user object if verified, or null if invalid.
 */
export async function authenticateAdmin(email, password) {
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  const cleanEmail = email.trim().toLowerCase();
  const admins = await getAuthorizedAdmins();

  const admin = admins.find((a) => a.email.toLowerCase() === cleanEmail);
  if (!admin) {
    return null;
  }

  let isValid = false;

  // 1. Verify against cryptographic scrypt hash
  if (admin.passwordHash) {
    isValid = verifyPassword(password, admin.passwordHash);
  }

  // 2. Backward-compatible upgrade for primary admin legacy password fallback
  if (!isValid && admin.isPrimary) {
    const expectedLegacy = process.env.ADMIN_PASSWORD || "admin2026";
    if (password === expectedLegacy) {
      isValid = true;
      // Upgrade hash to scrypt
      admin.passwordHash = hashPassword(password);
      await saveAuthorizedAdmins(admins);
    }
  }

  if (!isValid) {
    return null;
  }

  // Update last login timestamp
  admin.lastLoginAt = new Date().toISOString();
  saveAuthorizedAdmins(admins).catch(() => {});

  return {
    id: admin.id,
    name: admin.name || "Administrator",
    email: admin.email,
    role: "admin",
    isPrimary: Boolean(admin.isPrimary),
  };
}

/**
 * Create a new administrator account (authorized by an existing admin).
 */
export async function createAdminAccount({ name, email, password, creatorEmail }) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("Administrator name is required");
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    throw new Error("Administrator email is required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error("A valid email address is required");
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const admins = await getAuthorizedAdmins(true);

  // Check uniqueness
  const existing = admins.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error(`An administrator account with email "${cleanEmail}" already exists`);
  }

  const newAdmin = {
    id: `adm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    name: name.trim(),
    email: cleanEmail,
    passwordHash: hashPassword(password),
    role: "admin",
    isPrimary: false,
    createdBy: creatorEmail || "master_admin",
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };

  admins.push(newAdmin);
  await saveAuthorizedAdmins(admins);

  return {
    id: newAdmin.id,
    name: newAdmin.name,
    email: newAdmin.email,
    role: newAdmin.role,
    isPrimary: newAdmin.isPrimary,
    createdAt: newAdmin.createdAt,
    createdBy: newAdmin.createdBy,
  };
}

/**
 * List all authorized administrators (sanitized: passwords/hashes stripped).
 */
export async function listAdminAccounts() {
  const admins = await getAuthorizedAdmins();
  return admins.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    isPrimary: Boolean(a.isPrimary),
    createdAt: a.createdAt,
    lastLoginAt: a.lastLoginAt,
    createdBy: a.createdBy,
  }));
}

/**
 * Remove an administrator account (cannot remove primary admin).
 */
export async function deleteAdminAccount(adminId, requestingAdminEmail) {
  const admins = await getAuthorizedAdmins(true);
  const target = admins.find((a) => a.id === adminId);

  if (!target) {
    throw new Error("Administrator account not found");
  }

  if (target.isPrimary) {
    throw new Error("The primary administrator account cannot be deleted");
  }

  if (target.email.toLowerCase() === requestingAdminEmail?.toLowerCase()) {
    throw new Error("You cannot delete your own administrator account while logged in");
  }

  const updatedAdmins = admins.filter((a) => a.id !== adminId);
  await saveAuthorizedAdmins(updatedAdmins);

  return { deletedId: adminId, email: target.email };
}
