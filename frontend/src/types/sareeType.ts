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

/**
 * Admin categories. Gatti Borders sarees get their own category; SiCo and Pure Gadwal Handloom
 * sarees stay in SiCo Gadwal Sarees (as before). The category always follows the saree type.
 */
export const SICO_CATEGORY = { id: "cat_sico_gadwal", name: "SiCo Gadwal Sarees" } as const;
export const GATTI_CATEGORY = { id: "cat_gatti_borders", name: "Gatti Borders Sarees" } as const;
export const ADMIN_SAREE_CATEGORIES = [SICO_CATEGORY, GATTI_CATEGORY] as const;

export function isGattiCategory(c: { id?: string; name?: string } | null | undefined): boolean {
  return Boolean(c) && (c!.id === GATTI_CATEGORY.id || /gatti/i.test(String(c!.name || "")));
}

/** Saree type after the admin picks a category (keeps Pure Gadwal Handloom when staying on SiCo). */
export function sareeTypeForCategory(categoryId: string, current: SareeType): SareeType {
  if (categoryId === GATTI_CATEGORY.id) return "Gatti Borders";
  return current === "Gatti Borders" ? "SiCo" : current;
}
