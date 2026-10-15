/** The saree ranges sold in the shop (stored in the product's `material`). */
export const SAREE_TYPES = ["SiCo", "Pure Gadwal Handloom"] as const;
export type SareeType = (typeof SAREE_TYPES)[number];

export const SAREE_TYPE_LABELS: Record<SareeType, string> = {
  SiCo: "SiCo Gadwal Saree",
  "Pure Gadwal Handloom": "Pure Gadwal Handloom Saree",
};

/** Short name shown on admin cards and badges. */
export const SAREE_TYPE_SHORT: Record<SareeType, string> = {
  SiCo: "SiCo Gadwal",
  "Pure Gadwal Handloom": "Pure Gadwal Handloom",
};

/**
 * Maps whatever is stored ("SiCo Gadwal", "pure gadwal handloom"...) onto a type. Gatti Borders is
 * a design under SiCo Gadwal, not a type of its own, so anything else counts as SiCo.
 */
export function toSareeType(material: unknown): SareeType {
  const m = String(material || "");
  return /pure/i.test(m) && /gadwal/i.test(m) ? "Pure Gadwal Handloom" : "SiCo";
}
