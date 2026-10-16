import { test } from "node:test";
import assert from "node:assert/strict";
import { extractBundle, shouldReloadForUpdate } from "../src/utils/appVersion.ts";

const OLD = "/assets/index-BncAvC1H.js";
const NEW = "/assets/index-BraZFKLf.js";

test("finds the release's main script in index.html", () => {
  assert.equal(extractBundle(`<script type="module" crossorigin src="${NEW}"></script>`), NEW);
  assert.equal(extractBundle(`https://www.rsfashions25.com${OLD}`), OLD);
  assert.equal(extractBundle("<html>no script</html>"), null);
  assert.equal(extractBundle(undefined), null);
});

test("a tab running an older release reloads on the next page change", () => {
  assert.equal(shouldReloadForUpdate({ current: OLD, latest: NEW, nextPath: "/special-offers" }), true);
  assert.equal(shouldReloadForUpdate({ current: OLD, latest: NEW, nextPath: "/shop" }), true);
});

test("no reload when nothing changed, when unknown, or twice for the same release", () => {
  assert.equal(shouldReloadForUpdate({ current: NEW, latest: NEW, nextPath: "/shop" }), false);
  assert.equal(shouldReloadForUpdate({ current: OLD, latest: null, nextPath: "/shop" }), false);
  assert.equal(shouldReloadForUpdate({ current: null, latest: NEW, nextPath: "/shop" }), false);
  assert.equal(shouldReloadForUpdate({ current: OLD, latest: NEW, nextPath: "/shop", alreadyReloadedFor: NEW }), false);
});

test("never reloads into checkout, payment or sign-in pages", () => {
  for (const p of ["/checkout", "/checkout?step=payment", "/pay", "/login", "/auth/callback", "/admin-7f9a2b8e/login"]) {
    assert.equal(shouldReloadForUpdate({ current: OLD, latest: NEW, nextPath: p.split("?")[0] }), false, p);
  }
});
