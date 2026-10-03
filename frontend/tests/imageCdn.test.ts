import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteToCdn, getImageVariantUrl } from "../src/utils/imageVariants.ts";

const SUPA = "https://abc123.supabase.co/storage/v1/object/public/sarees/uploads";

test("with no CDN configured every photo URL is unchanged", () => {
  assert.equal(rewriteToCdn(`${SUPA}/sm/a.jpg`, ""), `${SUPA}/sm/a.jpg`);
  assert.equal(getImageVariantUrl(`${SUPA}/a.jpg`, "sm"), `${SUPA}/sm/a.jpg`);
});

test("Supabase sarees photos are rewritten to the CDN, keeping the path", () => {
  assert.equal(rewriteToCdn(`${SUPA}/sm/a.jpg`, "https://img.example.com"), "https://img.example.com/uploads/sm/a.jpg");
  assert.equal(rewriteToCdn(`${SUPA}/b.jpg`, "https://img.example.com/"), "https://img.example.com/uploads/b.jpg");
});

test("other URLs are never rewritten", () => {
  for (const u of ["/saree.png", "https://example.com/x.jpg", "https://abc.supabase.co/storage/v1/object/public/other/uploads/a.jpg", "data:image/png;base64,AAA"]) {
    assert.equal(rewriteToCdn(u, "https://img.example.com"), u);
  }
});
