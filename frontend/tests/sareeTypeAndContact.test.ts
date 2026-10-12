import { test } from "node:test";
import assert from "node:assert/strict";
import { SAREE_TYPES, SAREE_TYPE_LABELS, SAREE_TYPE_SHORT, toSareeType } from "../src/types/sareeType.ts";
import { SUPPORT_PHONE, SUPPORT_PHONE_TEL, SUPPORT_WHATSAPP, SUPPORT_PHONE_DISPLAY, whatsappLink } from "../src/config/business.ts";

test("Gatti Borders is a saree type with labels everywhere", () => {
  assert.deepEqual([...SAREE_TYPES], ["SiCo", "Pure Gadwal Handloom", "Gatti Borders"]);
  for (const t of SAREE_TYPES) {
    assert.ok(SAREE_TYPE_LABELS[t], `label for ${t}`);
    assert.ok(SAREE_TYPE_SHORT[t], `short label for ${t}`);
  }
});

test("stored materials map onto the right type", () => {
  assert.equal(toSareeType("Gatti Borders"), "Gatti Borders");
  assert.equal(toSareeType("gatti border"), "Gatti Borders");
  assert.equal(toSareeType("Pure Gadwal Handloom"), "Pure Gadwal Handloom");
  assert.equal(toSareeType("pure gadwal handloom silk"), "Pure Gadwal Handloom");
  assert.equal(toSareeType("SiCo"), "SiCo");
  assert.equal(toSareeType("SiCo Gadwal"), "SiCo");
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

test("admin category and saree type stay in sync", async () => {
  const { GATTI_CATEGORY, SICO_CATEGORY, ADMIN_SAREE_CATEGORIES, isGattiCategory, sareeTypeForCategory } = await import("../src/types/sareeType.ts");
  assert.deepEqual(ADMIN_SAREE_CATEGORIES.map((c) => c.name), ["SiCo Gadwal Sarees", "Gatti Borders Sarees"]);
  assert.equal(sareeTypeForCategory(GATTI_CATEGORY.id, "SiCo"), "Gatti Borders");
  assert.equal(sareeTypeForCategory(GATTI_CATEGORY.id, "Pure Gadwal Handloom"), "Gatti Borders");
  assert.equal(sareeTypeForCategory(SICO_CATEGORY.id, "Gatti Borders"), "SiCo");
  assert.equal(sareeTypeForCategory(SICO_CATEGORY.id, "Pure Gadwal Handloom"), "Pure Gadwal Handloom");
  assert.equal(isGattiCategory({ id: "cat_gatti_borders", name: "x" }), true);
  assert.equal(isGattiCategory({ id: "c9", name: "Gatti Borders Sarees" }), true);
  assert.equal(isGattiCategory({ id: "c1", name: "SiCo Gadwal Sarees" }), false);
  assert.equal(isGattiCategory(null), false);
});

test("Gatti Borders is in the canonical admin categories and the design list", async () => {
  const inv = await import("../src/types/inventory.ts");
  assert.ok(inv.CANONICAL_SAREE_CATEGORIES.some((c) => c.id === "cat_gatti_borders" && c.name === "Gatti Borders Sarees"));
  assert.ok(inv.MOCK_DESIGNS.some((d) => d.slug === "GB" && d.name === "Gatti Borders"));
});
