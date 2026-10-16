/**
 * The hamburger menu's names are THE category names. Every marquee / tile / footer link / search
 * tag on the site must show one of them, and must open exactly that category's page.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SICO_PATTERNS, SICO_ALL_LABEL, SICO_ALL_LINK, sicoPatternLink } from "../src/config/sareePatterns.ts";

const read = (p: string) => fs.readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const NAMES: readonly string[] = [SICO_ALL_LABEL, ...SICO_PATTERNS];
const linkFor = (name: string) => (name === SICO_ALL_LABEL ? SICO_ALL_LINK : sicoPatternLink(name as (typeof SICO_PATTERNS)[number]));

test("the menu lists exactly the shared names, each with its own page", () => {
  const menu = read("../src/components/layout/MobileMenu.tsx");
  assert.match(menu, /label: SICO_ALL_LABEL, path: SICO_ALL_LINK/);
  assert.match(menu, /SICO_PATTERNS\.map\(\(pattern\) => \(\{ label: pattern, path: sicoPatternLink\(pattern\) \}\)\)/);
  assert.deepEqual([...SICO_PATTERNS], ["Checks", "Equal Borders", "Kanchi Big Borders", "Vintage Checks", "Gatti Border", "Gap Border", "Maa Inti Bangaram"]);
});

test("Cinematic Reel: every card's name is a category and opens that category", () => {
  const src = read("../src/components/home/CinematicReel.tsx");
  const cards = [...src.matchAll(/name: "([^"]+)",[\s\S]*?link: sicoPatternLink\("([^"]+)"\)/g)].map((m) => [m[1], m[2]]);
  assert.equal(cards.length, 5, "all reel cards use pattern links");
  for (const [name, pattern] of cards) {
    assert.ok(NAMES.includes(name), `reel name "${name}" is a menu name`);
    assert.equal(name, pattern, `reel card "${name}" opens "${pattern}"`);
  }
  assert.doesNotMatch(src, /\/shop\?search=/);
});

test("weave tiles: name == the category they open", () => {
  const src = read("../src/components/home/MaterialCollections.tsx");
  const tiles = [...src.matchAll(/name: "([^"]+)",[\s\S]*?link: sicoPatternLink\("([^"]+)"\)/g)].map((m) => [m[1], m[2]]);
  assert.equal(tiles.length, 4);
  for (const [name, pattern] of tiles) {
    assert.ok(NAMES.includes(name), `tile "${name}" is a menu name`);
    assert.equal(name, pattern);
  }
});

test("showcase carousel: slide titles are menu names and open that category", () => {
  const src = read("../src/components/home/ProductShowcase.tsx");
  const slides = [...src.matchAll(/name: (SICO_ALL_LABEL|"[^"]+"),[\s\S]*?pattern: "([^"]+)",/g)].map((m) => [m[1] === "SICO_ALL_LABEL" ? SICO_ALL_LABEL : m[1].slice(1, -1), m[2]]);
  assert.equal(slides.length, 6);
  for (const [name, pattern] of slides) {
    assert.ok(NAMES.includes(name), `slide "${name}" is a menu name`);
    assert.equal(name === SICO_ALL_LABEL ? "All" : name, pattern, `slide "${name}" opens its own category`);
  }
});

test("footer links and header search tags use menu names and open that category", () => {
  const footer = read("../src/components/home/HomeFooter.tsx");
  const links = [...footer.matchAll(/label: "([^"]+)", path: sicoPatternLink\("([^"]+)"\)/g)].map((m) => [m[1], m[2]]);
  assert.ok(links.length >= 5);
  for (const [label, pattern] of links) assert.equal(label, pattern, `footer "${label}"`);

  const nav = read("../src/components/layout/Navbar.tsx");
  const tags = /\{\(\[([^\]]+)\] as SicoPattern\[\]\)\.map/.exec(nav)?.[1].split(",").map((t) => t.trim().slice(1, -1)) || [];
  assert.ok(tags.length >= 4, "search tags found");
  for (const t of tags) assert.ok(NAMES.includes(t), `search tag "${t}" is a menu name`);
  assert.match(nav, /navigate\(sicoPatternLink\(tag\)\)/);
});

test("no old variant spellings remain in customer-facing text", () => {
  const files = ["CinematicReel", "MaterialCollections", "ProductShowcase", "HomeFooter"].map((f) => read(`../src/components/home/${f}.tsx`));
  files.push(read("../src/components/layout/Navbar.tsx"), read("../src/components/layout/MobileMenu.tsx"));
  const all = files.join("\n");
  for (const bad of [/"Gatti Borders"/, /"Ma Inti Bangaram"/, /"Big Kanchi/, /KANCHI BORDER/, /GATTI BORDER/, /"Kanchi Big Border"/, /"Equal Border"/, /Kanchi Borders"/]) {
    assert.doesNotMatch(all, bad, String(bad));
  }
  void linkFor;
});
