/**
 * Durable payment state, backed by Supabase tables (see schema.sql section 11) so it survives
 * restarts and redeploys. If the tables are not installed yet, it falls back to process memory /
 * the local JSON files, exactly as before.
 *   - webhook_events : one row per processed webhook event (PK = atomic de-duplication)
 *   - pending_sales  : counter (POS) carts waiting for their Cashfree payment
 *   - settings.payment_alerts : failed/needs-attention payments shown to the admin
 */
import { supabase } from "../config/supabase.js";
import { isWebhookEventProcessed, recordWebhookEvent } from "../database/localStore.js";

const tableState = { webhook_events: null, pending_sales: null }; // null unknown, true/false after first use
const memoryPending = new Map();

function tableMissing(error) {
  return /42P01|PGRST205|does not exist|Could not find the table/i.test(`${error?.code} ${error?.message}`);
}

// ---------------------------------------------------------------------------------------------
// Webhook de-duplication
// ---------------------------------------------------------------------------------------------
/** Atomically claims an event. Returns true if this call is the first to process it. */
export async function claimWebhookEvent(eventId, details = {}) {
  if (!eventId) return true;
  if (supabase && tableState.webhook_events !== false) {
    const { error } = await supabase.from("webhook_events").insert({ event_id: eventId, details });
    if (!error) { tableState.webhook_events = true; return true; }
    if (error.code === "23505") return false;
    if (!tableMissing(error)) throw error;
    tableState.webhook_events = false;
    console.warn("[PaymentStore] webhook_events table missing; using local file for de-duplication. Run schema.sql section 11.");
  }
  if (isWebhookEventProcessed(eventId)) return false;
  recordWebhookEvent(eventId, details);
  return true;
}

/** Lets a failed delivery be retried by Cashfree (the claim is removed when processing threw). */
export async function releaseWebhookEvent(eventId) {
  if (supabase && tableState.webhook_events) await supabase.from("webhook_events").delete().eq("event_id", eventId);
}

// ---------------------------------------------------------------------------------------------
// Pending counter (POS) sales
// ---------------------------------------------------------------------------------------------
export async function savePendingSale(orderId, sale, aliasKey) {
  const keys = [orderId, aliasKey].filter(Boolean);
  if (supabase && tableState.pending_sales !== false) {
    const rows = keys.map((k) => ({ order_id: k, sale, committed: false }));
    const { error } = await supabase.from("pending_sales").upsert(rows, { onConflict: "order_id" });
    if (!error) { tableState.pending_sales = true; return; }
    if (!tableMissing(error)) throw error;
    tableState.pending_sales = false;
    console.warn("[PaymentStore] pending_sales table missing; counter carts are kept in memory only. Run schema.sql section 11.");
  }
  keys.forEach((k) => memoryPending.set(k, { ...sale, committed: false }));
}

/**
 * Atomically claims a pending sale for recording. Returns the sale once; later or concurrent
 * calls (admin polling + webhook) get null, so a sale is never recorded or deducted twice.
 */
export async function claimPendingSale(orderId) {
  if (supabase && tableState.pending_sales) {
    const { data, error } = await supabase
      .from("pending_sales")
      .update({ committed: true })
      .eq("order_id", orderId)
      .eq("committed", false)
      .select("sale")
      .maybeSingle();
    if (error) throw error;
    return data?.sale || null;
  }
  const hit = memoryPending.get(orderId);
  if (!hit || hit.committed) return null;
  hit.committed = true;
  return hit;
}

/** Puts a claimed sale back when recording it failed, so a later attempt can retry. */
export async function unclaimPendingSale(orderId) {
  if (supabase && tableState.pending_sales) {
    await supabase.from("pending_sales").update({ committed: false }).eq("order_id", orderId);
    return;
  }
  const hit = memoryPending.get(orderId);
  if (hit) hit.committed = false;
}

// ---------------------------------------------------------------------------------------------
// Admin payment alerts (failed / expired / needs attention)
// ---------------------------------------------------------------------------------------------
let alertChain = Promise.resolve();

export function recordPaymentAlert(alert) {
  const run = alertChain.then(async () => {
    const entry = { id: `pa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), ...alert };
    if (!supabase) return entry;
    const { data } = await supabase.from("settings").select("value").eq("key", "payment_alerts").maybeSingle();
    const list = Array.isArray(data?.value) ? data.value : [];
    // One alert per order+type: repeated webhooks must not spam the admin.
    const deduped = list.filter((a) => !(a.orderKey === entry.orderKey && a.type === entry.type));
    const next = [entry, ...deduped].slice(0, 50);
    await supabase.from("settings").upsert({ key: "payment_alerts", value: next, updated_at: new Date().toISOString() });
    return entry;
  });
  alertChain = run.catch(() => {});
  return run.catch((e) => { console.warn("[PaymentStore] could not save payment alert:", e.message); return null; });
}
