/**
 * Run from frontend/:  node --test tests/
 * (Node 22.18+/24 runs TypeScript directly by stripping types.)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { toWhatsAppNumber, daysUntilNextOccurrence } from "../src/utils/celebrations.ts";

test("toWhatsAppNumber: Indian mobiles get exactly one 91 prefix", () => {
  assert.equal(toWhatsAppNumber("9876543210"), "919876543210");
  // A 10-digit mobile that itself starts with 91 must not be mistaken for a country code.
  assert.equal(toWhatsAppNumber("9123456789"), "919123456789");
  assert.equal(toWhatsAppNumber("+91 98765 43210"), "919876543210");
  assert.equal(toWhatsAppNumber("91-9876543210"), "919876543210");
  assert.equal(toWhatsAppNumber("09876543210"), "919876543210");
  assert.equal(toWhatsAppNumber("0919876543210"), "919876543210");
});

test("toWhatsAppNumber: invalid or placeholder numbers are rejected", () => {
  for (const bad of ["", null, undefined, "G-12345678", "C-1790000000000", "12345", "1234567890", "5876543210", "98765432101234"]) {
    assert.equal(toWhatsAppNumber(bad as string), null, String(bad));
  }
});

test("daysUntilNextOccurrence ignores the birth/wedding year", () => {
  const today = new Date(2026, 9, 1); // 1 Oct 2026
  assert.equal(daysUntilNextOccurrence("1990-10-01", today), 0, "today");
  assert.equal(daysUntilNextOccurrence("1990-10-02", today), 1, "tomorrow");
  assert.equal(daysUntilNextOccurrence("1985-10-08", today), 7, "in a week");
  assert.equal(daysUntilNextOccurrence("2015-09-30", today), 364, "yesterday -> next year");
  assert.equal(daysUntilNextOccurrence("2026-12-31", today), 91, "current-year date");
});

test("daysUntilNextOccurrence handles 29 February and bad input", () => {
  assert.equal(daysUntilNextOccurrence("2000-02-29", new Date(2027, 1, 28)), 0, "falls on 28 Feb in a non-leap year");
  assert.equal(daysUntilNextOccurrence("2000-02-29", new Date(2028, 1, 28)), 1, "29 Feb exists in 2028");
  for (const bad of ["", null, undefined, "garbage", "2020-13-01", "10/02/1990"]) {
    assert.equal(daysUntilNextOccurrence(bad as string), null, String(bad));
  }
});
