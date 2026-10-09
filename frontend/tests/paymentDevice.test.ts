import { test } from "node:test";
import assert from "node:assert/strict";
import { inAppBrowserName, describeDevice } from "../src/utils/deviceInfo.ts";

const UA = {
  instagramIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20B101 Instagram 410.1.0.36.70 (iPhone13,4; iOS 16_1_1; en_GB) Safari/604.1",
  facebookAndroid: "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]",
  chromeIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/154.0.8037.55 Mobile/15E148 Safari/604.1",
  macChrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  ipadDesktopMode: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
};

test("Instagram / Facebook in-app browsers are recognised so checkout can warn about UPI", () => {
  assert.equal(inAppBrowserName(UA.instagramIphone), "Instagram");
  assert.equal(inAppBrowserName(UA.facebookAndroid), "Facebook");
  assert.equal(inAppBrowserName(UA.chromeIphone), null);
  assert.equal(inAppBrowserName(UA.macChrome), null);
  assert.equal(inAppBrowserName(""), null);
  assert.equal(inAppBrowserName(undefined), null);
});

test("iPhones and iPads are no longer labelled as a Mac", () => {
  assert.deepEqual(describeDevice(UA.chromeIphone), { platform: "ios", deviceName: "iPhone Mobile Counter" });
  assert.equal(describeDevice(UA.instagramIphone).platform, "ios");
  assert.deepEqual(describeDevice(UA.ipadDesktopMode, 5), { platform: "ios", deviceName: "Showroom iPad Terminal" });
  assert.deepEqual(describeDevice(UA.macChrome), { platform: "macos", deviceName: "MacBook Pro / iMac" });
  assert.deepEqual(describeDevice(UA.macChrome, 0), { platform: "macos", deviceName: "MacBook Pro / iMac" });
  assert.equal(describeDevice("Mozilla/5.0 (Linux; Android 14)").platform, "android");
});
