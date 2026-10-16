import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SICO_PATTERNS, sicoPatternLink } from "../src/config/sareePatterns.ts";

const read = (p: string) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

test("pattern links are the same filtered pages the hamburger menu opens", () => {
  assert.equal(sicoPatternLink("Maa Inti Bangaram"), "/shop?material=SiCo&category=Maa+Inti+Bangaram");
  assert.equal(sicoPatternLink("Kanchi Big Borders"), "/shop?material=SiCo&category=Kanchi+Big+Borders");
  // The menu builds its pattern links from the same list.
  const menu = read("../src/components/layout/MobileMenu.tsx");
  assert.match(menu, /SICO_PATTERNS\.map\(\(pattern\) => \(\{ label: pattern, path: sicoPatternLink\(pattern\) \}\)\)/);
  for (const p of SICO_PATTERNS) assert.match(sicoPatternLink(p), /^\/shop\?material=SiCo&category=/);
});

test("landing-page tiles and footer link to patterns, never to a plain text search", () => {
  for (const file of ["../src/components/home/MaterialCollections.tsx", "../src/components/home/HomeFooter.tsx"]) {
    const src = read(file);
    assert.doesNotMatch(src, /\/shop\?search=/, `${file} must not use ?search= links (they show 'No sarees')`);
    assert.match(src, /sicoPatternLink\(/);
  }
});

test("showcase carousel slides open pattern pages, not a text search of the slide title", () => {
  const src = read("../src/components/home/ProductShowcase.tsx");
  assert.doesNotMatch(src, /params\.set\("search"/);
  assert.match(src, /sicoPatternLink\(/);
  const patterns = [...src.matchAll(/pattern: "([^"]+)",/g)].map((m) => m[1]);
  assert.ok(patterns.length >= 6, "found the slides");
  for (const p of patterns) {
    assert.ok(p === "All" || (SICO_PATTERNS as readonly string[]).includes(p), `slide pattern "${p}" is a real shop pattern`);
  }
});
