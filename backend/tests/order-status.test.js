/** The order status lists on the front end and the back end must never drift apart. */
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.SUPABASE_ANON_KEY = "";
process.env.NODE_ENV = "test";

import { test } from "node:test";
import assert from "node:assert/strict";

test("front-end and back-end order statuses are identical", async () => {
  const { CANONICAL_ORDER_STATUSES } = await import("../src/controllers/sales.controller.js");
  const fe = await import("../../frontend/src/types/orderStatus.ts");
  assert.deepEqual([...CANONICAL_ORDER_STATUSES].sort(), [...fe.ALL_ORDER_STATUSES].sort());
});

test("Order Confirmed exists and the admin cannot pick Cancelled from the status list", async () => {
  const fe = await import("../../frontend/src/types/orderStatus.ts");
  assert.equal(fe.ORDER_STATUS_LABELS.confirmed, "Order Confirmed");
  assert.deepEqual([...fe.SELECTABLE_ORDER_STATUSES], ["ordered", "confirmed", "packaging", "shipped", "delivered"]);
  assert.ok(!fe.statusOptionsFor("ordered", "cashfree").includes("cancelled"));
  // an order that is already cancelled still shows its own status in the list
  assert.ok(fe.statusOptionsFor("cancelled", "cashfree").includes("cancelled"));
  assert.ok(fe.statusOptionsFor("ordered", "cod").includes("refused_by_user"));
  assert.equal(fe.normalizeOrderStatus("new"), "ordered");
  assert.equal(fe.normalizeOrderStatus("confirmed"), "confirmed");
});
