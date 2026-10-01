import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_ORDER_STATUSES } from "../src/controllers/sales.controller.js";
import { getReviewsFromStore, saveReviewToStore } from "../src/database/localStore.js";
import { sanitizeCustomerPhone } from "../src/controllers/crm.controller.js";

test("Canonical order statuses contain ordered, packaging, shipped, delivered, refused_by_user, cancelled", () => {
  assert.ok(CANONICAL_ORDER_STATUSES.has("ordered"));
  assert.ok(CANONICAL_ORDER_STATUSES.has("packaging"));
  assert.ok(CANONICAL_ORDER_STATUSES.has("shipped"));
  assert.ok(CANONICAL_ORDER_STATUSES.has("delivered"));
  assert.ok(CANONICAL_ORDER_STATUSES.has("refused_by_user"));
  assert.ok(CANONICAL_ORDER_STATUSES.has("cancelled"));
});

test("Customer CRM phone normalization rejects fake G- or C- prefixes", () => {
  assert.equal(sanitizeCustomerPhone("G-9876543210"), null);
  assert.equal(sanitizeCustomerPhone("C-1234567890"), null);
  assert.equal(sanitizeCustomerPhone("9876543210"), "9876543210");
  assert.equal(sanitizeCustomerPhone("+91 98765 43210"), "9876543210");
});

test("Reviews storage supports approved flag and filtering", () => {
  const testId = `rev-test-${Date.now()}`;
  saveReviewToStore({
    id: testId,
    productId: "RS0001",
    reviewerName: "Integration Test Patron",
    rating: 5,
    title: "Magnificent Handloom",
    content: "Flawless authentic Gadwal weave.",
    approved: true,
  });

  const approvedReviews = getReviewsFromStore(undefined, true);
  const found = approvedReviews.find((r) => r.id === testId);
  assert.ok(found, "Approved review should be found in approved-only query");
  assert.equal(found.approved, true);

  // Unapprove and verify filtered out
  saveReviewToStore({
    ...found,
    approved: false,
  });

  const approvedAfter = getReviewsFromStore(undefined, true);
  const foundAfter = approvedAfter.find((r) => r.id === testId);
  assert.equal(foundAfter, undefined, "Unapproved review should be excluded from approved query");
});
