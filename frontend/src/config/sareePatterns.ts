/**
 * Design patterns of the SiCo Gadwal range, as the shop filters them (/shop?material=SiCo&category=…).
 * Landing-page tiles, footer and menu link through here, so a link always lands on the same
 * filtered page as the hamburger menu (a plain text search misses spelling variants such as
 * "Ma Inti" vs "Maa Inti", and shows nothing).
 */
export const SICO_PATTERNS = [
  "Checks",
  "Equal Borders",
  "Kanchi Big Borders",
  "Vintage Checks",
  "Gatti Border",
  "Gap Border",
  "Maa Inti Bangaram",
] as const;
export type SicoPattern = (typeof SICO_PATTERNS)[number];

/** Shop page listing one SiCo Gadwal pattern. */
export function sicoPatternLink(pattern: SicoPattern): string {
  return `/shop?material=SiCo&category=${encodeURIComponent(pattern).replace(/%20/g, "+")}`;
}
