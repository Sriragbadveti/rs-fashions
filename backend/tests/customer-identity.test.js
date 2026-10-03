process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.SUPABASE_ANON_KEY = "";
process.env.NODE_ENV = "test";

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCustomerProfiles, phoneKey } from "../src/services/customerIdentity.js";

test("phone numbers match however they were typed", () => {
  assert.equal(phoneKey("+91 98765 43210"), "9876543210");
  assert.equal(phoneKey("9876543210"), "9876543210");
  assert.equal(phoneKey("G-123"), null);
  assert.equal(phoneKey("12345"), null);
});

test("cards for one person (email-only + phone-only) merge, and spend comes from real orders", async () => {
  const rows = [
    { id: "a", name: "asha", email: "asha@example.com", phone: null, created_at: "2026-01-01", total_spent: 999, orders_count: 7 },
    { id: "b", name: "Asha Reddy", email: null, phone: "+91 98765 43210", created_at: "2026-02-01", total_spent: 0, orders_count: 0 },
    { id: "c", name: "Asha Reddy", email: "asha@example.com", phone: "9876543210", created_at: "2026-03-01" },
    { id: "d", name: "Other", email: "o@example.com", phone: "9000000001", created_at: "2026-01-05" },
  ];
  const orders = [
    { phone: "+91 9876543210", email: null, total: 222, order_status: "ordered", payment_status: "paid", payment_method: "cashfree" },
    { phone: null, email: "ASHA@example.com", total: 1000, order_status: "delivered", payment_status: "paid", payment_method: "cashfree" },
    { phone: "9876543210", total: 500, order_status: "cancelled", payment_status: "paid", payment_method: "cashfree" },
    { phone: "9876543210", total: 700, order_status: "ordered", payment_status: "pending", payment_method: "cashfree" },
    { phone: "9000000001", total: 50, order_status: "completed", payment_status: "completed", payment_method: "cash" },
  ];
  const out = await buildCustomerProfiles(rows, orders);
  assert.equal(out.length, 2, "three cards of the same person become one");
  const asha = out.find((c) => c.merged_ids.includes("a"));
  assert.deepEqual([...asha.merged_ids].sort(), ["a", "b", "c"]);
  assert.equal(asha.name, "Asha Reddy");
  assert.equal(asha.email, "asha@example.com");
  assert.equal(asha.phone, "9876543210");
  assert.equal(asha.total_spent, 1222, "paid orders only: no cancelled, no unpaid");
  assert.equal(asha.orders_count, 2);
  assert.equal(out.find((c) => c.id === "d").total_spent, 50);
});
