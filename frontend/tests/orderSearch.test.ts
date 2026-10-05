import { test } from "node:test";
import assert from "node:assert/strict";
import { selectionForSearch } from "../src/utils/orderSearch.ts";

test("typing a name opens the first matching order without a click", () => {
  assert.equal(selectionForSearch("asha", ["057", "041"], "010"), "057");
});

test("keeps the open order while it is still among the matches", () => {
  assert.equal(selectionForSearch("asha", ["057", "041"], "041"), undefined);
});

test("no search text leaves the selection alone", () => {
  assert.equal(selectionForSearch("   ", ["057"], "010"), undefined);
});

test("no match closes the details instead of showing an unrelated order", () => {
  assert.equal(selectionForSearch("zzz", [], "010"), null);
});
