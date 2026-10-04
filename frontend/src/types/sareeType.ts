/** The two saree ranges sold in the shop (stored in the product's `material`). */
export const SAREE_TYPES = ["SiCo", "Pure Gadwal Handloom"] as const;
export type SareeType = (typeof SAREE_TYPES)[number];

export const SAREE_TYPE_LABELS: Record<SareeType, string> = {
  SiCo: "SiCo Gadwal Saree",
  "Pure Gadwal Handloom": "Pure Gadwal Handloom Saree",
};

/** Maps whatever is stored ("SiCo Gadwal", "pure gadwal handloom"...) onto one of the two types. */
export function toSareeType(material: unknown): SareeType {
  return /pure/i.test(String(material || "")) && /gadwal/i.test(String(material || "")) ? "Pure Gadwal Handloom" : "SiCo";
}
