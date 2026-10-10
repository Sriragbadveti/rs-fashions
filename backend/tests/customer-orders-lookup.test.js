/** My Orders lookup: only full phones / plain e-mails; the signed-in account e-mail is stored. */
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.SUPABASE_ANON_KEY = "";
process.env.NODE_ENV = "test";

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Isolated local store so nothing in the repo's data files is read or written.
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "rsf-orders-lookup-"));
process.env.RS_LOCAL_DATA_DIR = DATA_DIR;

const { normalizeAccountEmail } = await import("../src/services/onlineOrders.js");
const { getCustomerOrders } = await import("../src/controllers/sales.controller.js");

function call(query) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      set() { return this; },
      json(body) { resolve({ status: this.statusCode, body }); return this; },
    };
    getCustomerOrders({ query, headers: {} }, res);
  });
}

test("account e-mail is normalised, junk is dropped", () => {
  assert.equal(normalizeAccountEmail("  Someone.Name@Gmail.com "), "someone.name@gmail.com");
  assert.equal(normalizeAccountEmail(""), null);
  assert.equal(normalizeAccountEmail(undefined), null);
  assert.equal(normalizeAccountEmail("not-an-email"), null);
  assert.equal(normalizeAccountEmail("a@b.com,phone.neq.0"), null);
});

test("a partial phone or a wildcard / filter-injection e-mail is refused", async () => {
  for (const query of [{ phone: "9" }, { phone: "98765" }, { email: "%" }, { email: "x,phone.neq.0@a.com" }, { phone: "G-0617" }, {}]) {
    const r = await call(query);
    assert.equal(r.status, 400, JSON.stringify(query));
  }
});

test("a full phone or a real e-mail is accepted", async () => {
  assert.equal((await call({ phone: "+91 98765 43210" })).status, 200);
  assert.equal((await call({ email: "someone@gmail.com" })).status, 200);
  assert.equal((await call({ phone: "9876543210", email: "Someone@Gmail.com" })).status, 200);
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});
