import { test } from "node:test";
import assert from "node:assert/strict";
import type { ErrorEvent } from "@sentry/react";
import { isAutomationBrowserEvent, scrubBrowserEvent } from "../src/utils/monitoring.ts";

const withFrames = (...filenames: string[]) =>
  ({ exception: { values: [{ type: "TypeError", value: "x", stacktrace: { frames: filenames.map((filename) => ({ filename })) } }] } }) as unknown as ErrorEvent;

test("errors from automation browsers (<obscura:bootstrap> frames) are dropped", () => {
  const bot = withFrames("<obscura:bootstrap>", "https://rsfashions25.com/assets/index-abc.js");
  assert.equal(isAutomationBrowserEvent(bot), true);
  assert.equal(scrubBrowserEvent(bot), null);
  assert.equal(isAutomationBrowserEvent(withFrames("<puppeteer_evaluation_script>")), true);
});

test("real errors from our own code are still sent", () => {
  const real = withFrames("https://rsfashions25.com/assets/index-abc.js");
  assert.equal(isAutomationBrowserEvent(real), false);
  assert.notEqual(scrubBrowserEvent(real), null);
  assert.equal(isAutomationBrowserEvent({} as ErrorEvent), false);
  assert.equal(isAutomationBrowserEvent({ exception: { values: [{ type: "E" }] } } as unknown as ErrorEvent), false);
});
