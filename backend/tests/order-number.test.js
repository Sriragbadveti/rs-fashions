/** Order numbers are server-assigned and sequential, starting at 001 (local JSON mode only). */
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.SUPABASE_ANON_KEY = "";
process.env.NODE_ENV = "test";

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Own temp data dir so parallel test files never share (or touch) the real local JSON store.
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "rs-order-number-"));
process.env.RS_LOCAL_DATA_DIR = dataDir;
const ordersFile = path.join(dataDir, "orders.json");

before(() => fs.writeFileSync(ordersFile, "[]"));
after(() => fs.rmSync(dataDir, { recursive: true, force: true }));

test("first order number is 001 and numbers increase without gaps or duplicates", async () => {
  const { peekNextOrderNumber, withOrderNumberLock, padOrderNumber } = await import("../src/services/orderNumber.js");
  const { saveOrderToStore } = await import("../src/database/localStore.js");
  assert.equal(await peekNextOrderNumber(), "001");
  assert.equal(padOrderNumber(1000), "1000");

  // Concurrent allocations are serialised, so each gets a distinct next number.
  const got = await Promise.all(
    [1, 2, 3, 4, 5].map(() =>
      withOrderNumberLock(async () => {
        const n = await peekNextOrderNumber();
        saveOrderToStore({ id: `t-${n}`, order_number: n, invoice_number: n, orderNumber: n, invoiceNumber: n });
        return n;
      })
    )
  );
  assert.deepEqual(got, ["001", "002", "003", "004", "005"]);
  assert.equal(await peekNextOrderNumber(), "006");
});

test("non-numeric legacy order numbers are ignored when numbering", async () => {
  const { peekNextOrderNumber } = await import("../src/services/orderNumber.js");
  const { saveOrderToStore } = await import("../src/database/localStore.js");
  saveOrderToStore({ id: "legacy", order_number: "RSF-ORD-ABC123", invoice_number: "RSF-ORD-ABC123" });
  assert.equal(await peekNextOrderNumber(), "006");
});
