import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SICO_PATTERNS, sicoPatternLink } from "../src/config/sareePatterns.ts";

const read = (p: string) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

test("pattern links are the same filtered pages the hamburger menu opens", () => {
  assert.equal(sicoPatternLink("Maa Inti Bangaram"), "/shop?material=SiCo&category=Maa+Inti+Bangaram");
  assert.equal(sicoPatternLink("Kanchi Big Borders"), "/shop?material=SiCo&category=Kanchi+Big+Borders");
  const menu = read("../src/components/layout/MobileMenu.tsx");
  for (const p of SICO_PATTERNS) assert.ok(menu.includes(`"${sicoPatternLink(p)}"`), `menu has ${p}`);
});

test("landing-page tiles and footer link to patterns, never to a plain text search", () => {
  for (const file of ["../src/components/home/MaterialCollections.tsx", "../src/components/home/HomeFooter.tsx"]) {
    const src = read(file);
    assert.doesNotMatch(src, /\/shop\?search=/, `${file} must not use ?search= links (they show 'No sarees')`);
    assert.match(src, /sicoPatternLink\(/);
  }
});
