import { test } from "node:test";
import assert from "node:assert/strict";
import { scrubEvent, redactText } from "../src/utils/sentryScrub.js";

test("customer details and secrets never reach Sentry", () => {
  const event = scrubEvent({
    message: "Order failed for asha@example.com phone +91 98765 43210",
    request: {
      url: "https://x.test/api/orders?phone=9876543210",
      data: { customerPhone: "9876543210", address: "12 Gandhi Nagar" },
      cookies: { session: "abc" },
      headers: { authorization: "Bearer secret", cookie: "a=b", "user-agent": "Mozilla" },
      query_string: "phone=9876543210&email=a@b.co",
    },
    user: { id: "u1", email: "asha@example.com", ip_address: "1.2.3.4" },
    exception: { values: [{ value: "bad phone 9876543210" }] },
    breadcrumbs: [{ message: "POST asha@example.com", data: { body: "secret" } }],
  });
  assert.equal(event.request.data, undefined);
  assert.equal(event.request.cookies, undefined);
  assert.equal(event.request.headers.authorization, undefined);
  assert.equal(event.request.headers.cookie, undefined);
  assert.equal(event.request.headers["user-agent"], "Mozilla");
  assert.deepEqual(event.user, { id: "u1" });
  assert.ok(!/asha@example\.com|98765/.test(JSON.stringify(event)));
  assert.equal(redactText("no personal data here"), "no personal data here");
});
