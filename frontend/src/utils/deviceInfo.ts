/**
 * Browser/device helpers with no app imports (so they can be unit-tested directly).
 */

/** Label and platform for the device-session list, from the browser's user agent. */
export function describeDevice(ua: string, maxTouchPoints?: number): { deviceName: string; platform: string } {
  let platform = "windows";
  let deviceName = "Billing Terminal (Web)";

  // iPhones say "like Mac OS X" and iPads in desktop mode say "Macintosh", so check iOS first.
  const isIPadDesktopMode = /Macintosh/i.test(ua) && (maxTouchPoints || 0) > 1;
  if (/iphone|ipad|ipod/i.test(ua) || isIPadDesktopMode) {
    platform = "ios";
    deviceName = /ipad/i.test(ua) || isIPadDesktopMode ? "Showroom iPad Terminal" : "iPhone Mobile Counter";
  } else if (/mac/i.test(ua)) {
    platform = "macos";
    deviceName = "MacBook Pro / iMac";
  } else if (/android/i.test(ua)) {
    platform = "android";
    deviceName = "Android POS Terminal";
  } else if (/windows/i.test(ua)) {
    platform = "windows";
    deviceName = "Showroom PC Terminal (Windows)";
  } else if (/linux/i.test(ua)) {
    platform = "linux";
    deviceName = "Linux Workstation";
  }

  return { deviceName, platform };
}

/**
 * Name of the social app whose built-in browser the page is open in (Instagram, Facebook...), or
 * null in a normal browser. UPI apps often fail to open from these in-app browsers, so checkout
 * suggests opening the page in Safari/Chrome first.
 */
export function inAppBrowserName(ua: string | undefined | null): string | null {
  const s = String(ua || "");
  if (/Instagram/i.test(s)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(s)) return "Facebook";
  if (/Snapchat/i.test(s)) return "Snapchat";
  if (/LinkedInApp/i.test(s)) return "LinkedIn";
  return null;
}
