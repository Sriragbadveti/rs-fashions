/**
 * Sequential order / invoice numbers: 001, 002, 003 ... (counter and online orders share one
 * sequence). The next number is max(numeric order/invoice numbers seen) + 1, padded to 3 digits;
 * with no numbered orders yet it is "001". Legacy non-numeric numbers (RSF-ORD-…) are ignored.
 */
import { supabase } from "../config/supabase.js";
import { getNextSequentialInvoiceNumberFromStore } from "../database/localStore.js";

export const padOrderNumber = (n) => String(n).padStart(3, "0");

export async function peekNextOrderNumber() {
  let max = 0;
  try {
    const localVal = parseInt(getNextSequentialInvoiceNumberFromStore(), 10);
    if (!isNaN(localVal) && localVal - 1 > max) max = localVal - 1;
  } catch {}

  if (supabase) {
    try {
      // Newest rows first so the 500-row window always contains the highest number in use.
      const { data } = await supabase
        .from("orders")
        .select("invoice_number, order_number")
        .order("created_at", { ascending: false })
        .limit(500);
      for (const o of data || []) {
        const inv = String(o.invoice_number || o.order_number || "").trim();
        if (/^\d+$/.test(inv)) max = Math.max(max, parseInt(inv, 10));
      }
    } catch {}
  }
  return padOrderNumber(max + 1);
}

// One allocation at a time per server instance; the UNIQUE(order_number) insert (retried by the
// caller on conflict) covers multiple instances.
let chain = Promise.resolve();
export function withOrderNumberLock(fn) {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}
