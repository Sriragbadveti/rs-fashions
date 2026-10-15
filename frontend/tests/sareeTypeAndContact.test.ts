import { test } from "node:test";
import assert from "node:assert/strict";
import { SAREE_TYPES, SAREE_TYPE_LABELS, SAREE_TYPE_SHORT, toSareeType } from "../src/types/sareeType.ts";
import { SUPPORT_PHONE, SUPPORT_PHONE_TEL, SUPPORT_WHATSAPP, SUPPORT_PHONE_DISPLAY, whatsappLink } from "../src/config/business.ts";

test("two saree types, each with labels", () => {
  assert.deepEqual([...SAREE_TYPES], ["SiCo", "Pure Gadwal Handloom"]);
  for (const t of SAREE_TYPES) {
    assert.ok(SAREE_TYPE_LABELS[t], `label for ${t}`);
    assert.ok(SAREE_TYPE_SHORT[t], `short label for ${t}`);
  }
});

test("stored materials map onto the right type; Gatti Borders is a SiCo design", () => {
  assert.equal(toSareeType("Pure Gadwal Handloom"), "Pure Gadwal Handloom");
  assert.equal(toSareeType("pure gadwal handloom silk"), "Pure Gadwal Handloom");
  assert.equal(toSareeType("SiCo"), "SiCo");
  assert.equal(toSareeType("SiCo Gadwal"), "SiCo");
  assert.equal(toSareeType("Gatti Borders"), "SiCo");
  assert.equal(toSareeType(""), "SiCo");
  assert.equal(toSareeType(undefined), "SiCo");
});

test("support phone and every WhatsApp query go to 9100570881", () => {
  assert.equal(SUPPORT_PHONE, "9100570881");
  assert.equal(SUPPORT_PHONE_TEL, "+919100570881");
  assert.equal(SUPPORT_WHATSAPP, "919100570881");
  assert.equal(SUPPORT_PHONE_DISPLAY.replace(/\D/g, ""), "919100570881");
  assert.match(whatsappLink("Hi"), /[?&]phone=919100570881&/);
});

test("Gatti Borders stays a design under SiCo, not a separate category", async () => {
  const inv = await import("../src/types/inventory.ts");
  assert.ok(inv.MOCK_DESIGNS.some((d) => d.slug === "GB" && d.name === "Gatti Borders"));
  assert.ok(!inv.CANONICAL_SAREE_CATEGORIES.some((c) => /gatti/i.test(c.name) || c.id === "cat_gatti_borders"));
  assert.deepEqual(inv.CANONICAL_SAREE_CATEGORIES.map((c) => c.name), ["SiCo Gadwal Sarees"]);
});
