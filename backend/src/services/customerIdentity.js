/**
 * One person = one customer card.
 * The same shopper can reach the system through different doors (Google sign-in gives an email,
 * checkout gives a phone like "+91 98765 43210", the counter gives "9876543210"), which used to
 * create several cards. People are matched by the last 10 digits of their phone OR their email.
 * Spend / order counts are always computed from the real orders, so they can never drift from what
 * was actually paid.
 */
import { supabase } from "../config/supabase.js";
import { isVisibleOrder, amountPaid } from "./orderVisibility.js";

export const phoneKey = (p) => {
  const s = String(p || "");
  if (/^[GC]-/.test(s)) return null; // legacy placeholders
  const d = s.replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : null;
};
export const emailKey = (e) => {
  const s = String(e || "").trim().toLowerCase();
  return s.includes("@") ? s : null;
};

/** Existing customer row for this phone and/or email (null if none). */
export async function findExistingCustomer({ phone, email } = {}) {
  if (!supabase) return null;
  const p = phoneKey(phone);
  const e = emailKey(email);
  if (!p && !e) return null;
  const clauses = [];
  if (p) clauses.push(`phone.ilike.%${p}%`);
  if (e) clauses.push(`email.ilike.${e}`);
  const { data } = await supabase.from("customers").select("*").or(clauses.join(",")).order("created_at", { ascending: true }).limit(1);
  return data?.[0] || null;
}

/** Every row that belongs to the same person as `row` (including itself). */
export async function findSamePersonRows(row) {
  if (!supabase || !row) return row ? [row] : [];
  const p = phoneKey(row.phone);
  const e = emailKey(row.email);
  const clauses = [`id.eq.${row.id}`];
  if (p) clauses.push(`phone.ilike.%${p}%`);
  if (e) clauses.push(`email.ilike.${e}`);
  const { data } = await supabase.from("customers").select("*").or(clauses.join(","));
  return data?.length ? data : [row];
}

const GENERIC_NAMES = new Set(["valued patron", "customer", "counter guest", "guest customer", "patron", "online patron", "valued customer"]);
const isGenericName = (row) => {
  const n = String(row.name || "").trim().toLowerCase();
  if (!n || GENERIC_NAMES.has(n)) return true;
  const e = emailKey(row.email);
  return Boolean(e && n === e.split("@")[0]);
};

// The orders scan is the heaviest part of the admin refresh, so reuse it for a minute. It is
// cleared (resetCustomerStatsCache) whenever an order is created or changes.
let statsCache = null;
let statsCacheAt = 0;
const STATS_TTL_MS = 60 * 1000;
export function resetCustomerStatsCache() {
  statsCache = null;
  statsCacheAt = 0;
}

async function loadOrderStats() {
  if (!supabase) return null;
  if (statsCache && Date.now() - statsCacheAt < STATS_TTL_MS) return statsCache;
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("phone, email, total, subtotal, discount_amount, cgst, sgst, order_status, payment_status, payment_method")
      .limit(5000);
    if (error) return null;
    statsCache = data || [];
    statsCacheAt = Date.now();
    return statsCache;
  } catch {
    return null;
  }
}

/**
 * Merges rows of the same person and fills spend / order count from real orders.
 * Returns raw-row-shaped objects (so existing mappers keep working) plus `merged_ids`.
 */
export async function buildCustomerProfiles(rows, ordersOverride) {
  const list = Array.isArray(rows) ? rows : [];
  const parent = list.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => { parent[find(a)] = find(b); };

  const byPhone = new Map();
  const byEmail = new Map();
  list.forEach((r, i) => {
    const p = phoneKey(r.phone);
    const e = emailKey(r.email);
    if (p) byPhone.has(p) ? union(i, byPhone.get(p)) : byPhone.set(p, i);
    if (e) byEmail.has(e) ? union(i, byEmail.get(e)) : byEmail.set(e, i);
  });

  const groups = new Map();
  list.forEach((r, i) => {
    const g = find(i);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(r);
  });

  const orders = ordersOverride || (await loadOrderStats());
  const stats = new Map(); // group root -> { spent, count }
  if (orders) {
    for (const o of orders) {
      if (!isVisibleOrder(o)) continue;
      if (String(o.order_status || "").toLowerCase() === "cancelled") continue;
      const p = phoneKey(o.phone);
      const e = emailKey(o.email);
      const idx = (p && byPhone.get(p)) ?? (e && byEmail.get(e));
      if (idx === undefined || idx === null || idx === false) continue;
      const g = find(idx);
      const s = stats.get(g) || { spent: 0, count: 0 };
      s.spent += amountPaid(o);
      s.count += 1;
      stats.set(g, s);
    }
  }

  const out = [];
  for (const [g, members] of groups) {
    const sorted = [...members].sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
    const base = sorted[0];
    const pick = (field) => sorted.map((r) => r[field]).find((v) => v !== null && v !== undefined && String(v).trim() !== "");
    const nameRow = [...sorted].reverse().find((r) => !isGenericName(r)) || base;
    const phoneRow = sorted.find((r) => phoneKey(r.phone));
    const s = stats.get(g);
    out.push({
      ...base,
      name: nameRow.name || base.name,
      email: pick("email") || null,
      phone: phoneRow ? phoneKey(phoneRow.phone) : null,
      address: pick("address") || base.address,
      birthday: pick("birthday") || null,
      anniversary: pick("anniversary") || null,
      preferred_weave: pick("preferred_weave") || null,
      gstin: pick("gstin") || null,
      notes: sorted.some((r) => /google/i.test(r.notes || "")) ? (sorted.find((r) => /google/i.test(r.notes || "")).notes) : base.notes,
      total_spent: orders ? (s ? s.spent : 0) : members.reduce((t, r) => t + (Number(r.total_spent) || 0), 0),
      orders_count: orders ? (s ? s.count : 0) : members.reduce((t, r) => t + (Number(r.orders_count) || 0), 0),
      merged_ids: members.map((r) => r.id),
    });
  }
  return out.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}
