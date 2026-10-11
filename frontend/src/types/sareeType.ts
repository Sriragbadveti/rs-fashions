/** The saree ranges sold in the shop (stored in the product's `material`). */
export const SAREE_TYPES = ["SiCo", "Pure Gadwal Handloom", "Gatti Borders"] as const;
export type SareeType = (typeof SAREE_TYPES)[number];

export const SAREE_TYPE_LABELS: Record<SareeType, string> = {
  SiCo: "SiCo Gadwal Saree",
  "Pure Gadwal Handloom": "Pure Gadwal Handloom Saree",
  "Gatti Borders": "Gatti Borders Saree",
};

/** Short name shown on admin cards and badges. */
export const SAREE_TYPE_SHORT: Record<SareeType, string> = {
  SiCo: "SiCo Gadwal",
  "Pure Gadwal Handloom": "Pure Gadwal Handloom",
  "Gatti Borders": "Gatti Borders",
};

/** Maps whatever is stored ("SiCo Gadwal", "pure gadwal handloom", "Gatti Border"...) onto a type. */
export function toSareeType(material: unknown): SareeType {
  const m = String(material || "");
  if (/gatti/i.test(m)) return "Gatti Borders";
  if (/pure/i.test(m) && /gadwal/i.test(m)) return "Pure Gadwal Handloom";
  return "SiCo";
}
