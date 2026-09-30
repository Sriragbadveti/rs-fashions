import express from "express";
import http from "http";
import crypto from "crypto";
import apiRouter from "./src/routes/index.js";
import { ENV } from "./src/config/env.js";
import { generateAdminToken, revokeAdminToken, verifyAdminToken } from "./src/middleware/adminAuth.js";
import {
  savePaymentAttempt,
  updatePaymentAttemptStatus,
  getPaymentHistory,
  isWebhookEventProcessed,
  recordWebhookEvent,
  findOrderFromStore,
  markOrderPaidInStore,
} from "./src/database/localStore.js";

// Setup express test instance
const app = express();
app.use(express.json());
app.use("/api", apiRouter);

const server = http.createServer(app);
const TEST_PORT = 5099;

function fetchJson(url, options = {}) {
  return fetch(`http://127.0.0.1:${TEST_PORT}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-benchmark-mock": "true",
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const text = await res.text();
    try {
      return { status: res.status, ok: res.ok, data: JSON.parse(text) };
    } catch {
      return { status: res.status, ok: res.ok, raw: text };
    }
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`\n==================================================`);
  console.log(`STARTING SECURITY & PAYMENT RELIABILITY AUDIT TEST SUITE`);
  console.log(`==================================================\n`);

  try {
    // ----------------------------------------------------
    // PHASE 1: ADMIN SESSION ISOLATION & SERVER-SIDE AUTH
    // ----------------------------------------------------
    console.log(`[TEST SUITE] Running Admin Session Isolation & Server Auth Tests...`);

    // 1. Unauthenticated direct access to /api/admin/bootstrap is BLOCKED (401)
    const unauthRes = await fetchJson("/api/admin/bootstrap");
    assert(unauthRes.status === 401, "Direct access to /api/admin/bootstrap without token is blocked with 401 Unauthorized");

    // 2. Admin Login in Tab A
    const loginResA = await fetchJson("/api/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@rsfashions.in", password: "admin2026" }),
    });
    assert(loginResA.ok && loginResA.data?.data?.token, "Window A logged in successfully and received cryptographically signed token");
    const tokenA = loginResA.data.data.token;

    // 3. Authorized access with Window A token works
    const authResA = await fetchJson("/api/admin/bootstrap", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(authResA.ok, "Window A token allows authorized access to /api/admin/bootstrap");

    // 4. Logout from Window A
    const logoutResA = await fetchJson("/api/auth/admin-logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(logoutResA.ok, "Window A successfully logged out and revoked its token");

    // 5. Window A's revoked token is now immediately rejected
    const postLogoutA = await fetchJson("/api/admin/bootstrap", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(postLogoutA.status === 401, "Window A's revoked token is rejected with 401 Unauthorized");

    // 6. Login from Window B (isolated tab)
    const loginResB = await fetchJson("/api/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@rsfashions.in", password: "admin2026" }),
    });
    assert(loginResB.ok && loginResB.data?.data?.token, "Window B logged in and received its own unique token");
    const tokenB = loginResB.data.data.token;
    assert(tokenA !== tokenB, "Window B receives a new unique token distinct from Window A");

    // 7. Verify Window A remains unauthenticated despite Window B logging in!
    const verifyWindowA = await fetchJson("/api/auth/admin-verify", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(verifyWindowA.status === 401, "Window A remains strictly unauthenticated after Window B logs in (No cross-tab admin leakage!)");

    // ----------------------------------------------------
    // PHASES 3-10: CASHFREE DOUBLE-PAYMENT & CONCURRENCY TESTS
    // ----------------------------------------------------
    console.log(`\n[TEST SUITE] Running Cashfree Double-Payment & Concurrency Scenarios...`);

    const testOrder1 = `ORD_TEST_1_${Date.now()}`;

    // TEST 1: Single Pay click -> one payment attempt
    const t1 = await fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({
        amount: 8500,
        customerPhone: "9876543210",
        customerName: "Auditor 1",
        orderNumber: testOrder1,
      }),
    });
    assert(t1.ok && t1.data?.data?.paymentSessionId, "TEST 1: Single Pay click produces one valid payment attempt");
    const session1 = t1.data.data.paymentSessionId;
    const orderId1 = t1.data.data.orderId;

    // TEST 2: Double-click Pay immediately -> one payment attempt (reuses existing active session)
    const t2 = await fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({
        amount: 8500,
        customerPhone: "9876543210",
        customerName: "Auditor 1",
        orderNumber: testOrder1,
      }),
    });
    assert(t2.ok && t2.data?.data?.paymentSessionId === session1, "TEST 2: Immediate double-click reuses existing valid payment session without duplicate order");
    assert(t2.data?.data?.orderId === orderId1, "TEST 2: Cashfree Order ID remains identical across double-clicks");

    // TEST 3: Five rapid Pay clicks -> one payment attempt
    const rapidPromises = Array.from({ length: 5 }, () =>
      fetchJson("/api/payments/cashfree/create-order", {
        method: "POST",
        body: JSON.stringify({
          amount: 8500,
          customerPhone: "9876543210",
          customerName: "Auditor 1",
          orderNumber: testOrder1,
        }),
      })
    );
    const rapidResults = await Promise.all(rapidPromises);
    const allSameSession = rapidResults.every((r) => r.data?.data?.paymentSessionId === session1);
    assert(allSameSession, "TEST 3: Five rapid Pay clicks all resolve to the same payment session");

    // TEST 4: Two simultaneous HTTP requests to create-order endpoint -> concurrency lock prevents race condition
    const testOrder2 = `ORD_TEST_CONC_${Date.now()}`;
    const p1 = fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({
        amount: 14500,
        customerPhone: "9988776655",
        orderNumber: testOrder2,
      }),
    });
    const p2 = fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({
        amount: 14500,
        customerPhone: "9988776655",
        orderNumber: testOrder2,
      }),
    });
    const [c1, c2] = await Promise.all([p1, p2]);
    assert(c1.ok && c2.ok, "TEST 4: Both simultaneous requests complete successfully");
    assert(c1.data.data.paymentSessionId === c2.data.data.paymentSessionId, "TEST 4: Concurrency mutex lock ensures single logical payment attempt created for parallel requests");
    assert(c1.data.data.orderId === c2.data.data.orderId, "TEST 4: Same Cashfree order ID returned for both simultaneous requests");

    // TEST 5: Two browser tabs attempting payment for the same order -> no duplicate charge
    const tab1Res = await fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 14500, customerPhone: "9988776655", orderNumber: testOrder2 }),
    });
    assert(tab1Res.data.data.orderId === c1.data.data.orderId, "TEST 5: Second tab receives the existing active order ID without creating a duplicate");

    // TEST 6: Network recovery / Status query -> retry does not blindly create another payment
    const statusRes = await fetchJson(`/api/payments/cashfree/status/${testOrder2}`);
    assert(statusRes.ok && statusRes.data?.data?.paymentSessionId === c1.data.data.paymentSessionId, "TEST 6: Status query retrieves existing session on network recovery");

    // TEST 7: Existing payment is PENDING -> another Pay request does not create an unnecessary duplicate
    const historyBefore = getPaymentHistory(testOrder2);
    assert(historyBefore.attempts.length === 1, "TEST 7: Only 1 attempt exists in store for PENDING order");
    const pendingRetry = await fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 14500, customerPhone: "9988776655", orderNumber: testOrder2 }),
    });
    assert(pendingRetry.data.data.reused === true, "TEST 7: Pay request against PENDING order reuses active session");

    // TEST 8: Existing payment is PAID -> another Pay request cannot create another payment
    // Mark order as PAID
    updatePaymentAttemptStatus(c1.data.data.orderId, "PAID");
    const paidPayRes = await fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 14500, customerPhone: "9988776655", orderNumber: testOrder2 }),
    });
    assert(paidPayRes.ok && paidPayRes.data?.data?.orderStatus === "PAID", "TEST 8: Pay request against PAID order immediately returns PAID state");
    assert(paidPayRes.data?.data?.alreadyPaid === true, "TEST 8: alreadyPaid flag returned, zero new charges created");

    // TEST 9: Cashfree webhook delivered twice -> database updated once and idempotent response
    const mockWebhookBody = {
      type: "PAYMENT_SUCCESS_WEBHOOK",
      event_id: `evt_test_${Date.now()}`,
      data: {
        order: { order_id: testOrder1 },
        payment: {
          cf_payment_id: `cf_pay_test_${Date.now()}`,
          payment_status: "SUCCESS",
          order_id: testOrder1,
        },
      },
    };

    const webhookTs = String(Date.now());
    const webhookBodyStr = JSON.stringify(mockWebhookBody);
    const webhookSig = crypto
      .createHmac("sha256", String(ENV.CASHFREE.SECRET_KEY).trim())
      .update(webhookTs + webhookBodyStr)
      .digest("base64");

    const webhookHeaders = {
      "x-webhook-timestamp": webhookTs,
      "x-webhook-signature": webhookSig,
    };

    const webhook1 = await fetchJson("/api/payments/cashfree/webhook", {
      method: "POST",
      headers: webhookHeaders,
      body: webhookBodyStr,
    });
    assert(webhook1.ok && webhook1.data?.data?.processed === true, "TEST 9: First webhook delivery successfully processed");

    const webhook2 = await fetchJson("/api/payments/cashfree/webhook", {
      method: "POST",
      headers: webhookHeaders,
      body: webhookBodyStr,
    });
    assert(webhook2.ok && webhook2.data?.data?.deduplicated === true, "TEST 9: Duplicate webhook delivery is identified and deduplicated without re-executing");

    // TEST 10: Failed payment followed by legitimate retry -> new payment attempt is allowed
    const testOrder3 = `ORD_RETRY_${Date.now()}`;
    const initialAttempt = await fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 6200, customerPhone: "9123456780", orderNumber: testOrder3 }),
    });
    assert(initialAttempt.data.data.attemptNumber === 1, "TEST 10: Initial attempt created with attemptNumber 1");

    // Simulate genuine failure from Cashfree
    updatePaymentAttemptStatus(initialAttempt.data.data.orderId, "FAILED");

    // Legitimate retry
    const retryAttempt = await fetchJson("/api/payments/cashfree/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: 6200, customerPhone: "9123456780", orderNumber: testOrder3 }),
    });
    assert(retryAttempt.data.data.attemptNumber === 2, "TEST 10: Legitimate retry after genuine failure increments attemptNumber to 2");
    assert(retryAttempt.data.data.orderId.endsWith("_A2"), "TEST 10: Cashfree order ID reflects Attempt 2 (RSF_..._A2)");

    console.log(`\n==================================================`);
    console.log(`🎉 ALL 10 PAYMENT SCENARIOS + ADMIN SESSION TESTS PASSED!`);
    console.log(`==================================================\n`);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
