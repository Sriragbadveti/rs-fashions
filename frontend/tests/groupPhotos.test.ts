import { test } from "node:test";
import assert from "node:assert/strict";
import { groupPhotos } from "../src/utils/groupPhotos.ts";
import { getDesignDescription, isAutoDescription, DESIGN_DESCRIPTIONS } from "../src/types/designDescriptions.ts";

test("10 photos -> 5 sarees of 2, in order", () => {
  const g = groupPhotos(Array.from({ length: 10 }, (_, i) => i + 1));
  assert.equal(g.length, 5);
  assert.deepEqual(g, [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]);
});

test("an odd last photo becomes its own saree", () => {
  assert.deepEqual(groupPhotos([1, 2, 3, 4, 5]), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(groupPhotos([1]), [[1]]);
  assert.deepEqual(groupPhotos([]), []);
});

test("each of the five design patterns has a description, found by slug or name", () => {
  assert.equal(Object.keys(DESIGN_DESCRIPTIONS).length, 5);
  for (const name of ["Checks", "Equal Borders", "Kanchi Big Borders", "Gap Border", "Maa Inti Bangaram"]) {
    assert.ok(getDesignDescription(name).length > 50, name);
  }
  assert.equal(getDesignDescription("CHECKS"), getDesignDescription("checks"));
  assert.equal(getDesignDescription("Unknown Design"), "");
});

test("auto-generated descriptions are replaced, custom ones are kept", () => {
  assert.equal(isAutoDescription("Bulk loom intake for Checks."), true);
  assert.equal(isAutoDescription("Handcrafted Checks saree drape."), true);
  assert.equal(isAutoDescription(""), true);
  assert.equal(isAutoDescription("Our own custom text."), false);
});
