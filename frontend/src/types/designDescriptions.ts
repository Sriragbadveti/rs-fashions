/**
 * Placeholder descriptions for the five Gadwal design patterns. Paragraphs are separated by a
 * blank line and rendered as separate paragraphs on the product page.
 * TODO: replace with the client's final copy (edit the strings below).
 */
export const DESIGN_DESCRIPTIONS: Record<string, string> = {
  CHECKS:
    "Woven in the classic Gadwal checks, this saree pairs a crisp grid of interlocking squares with a light, breathable SiCo drape.\n\nThe balanced pattern keeps it graceful for everyday elegance, while the fine zari edging lifts it for festive gatherings.",
  "EQUAL-BORDERS":
    "A harmony of symmetry: both borders are woven in identical width and design, framing the body in a clean, timeless line.\n\nSoft to the touch and light to wear, it drapes beautifully from morning functions to evening celebrations.",
  "KANCHI-BIG-BORDERS":
    "Inspired by temple heritage, this saree carries a bold Kanchi-style border that makes a rich statement against the plain body.\n\nThe broad zari border is woven into the fabric itself, so the grandeur stays brilliant wash after wash.",
  "GAP-BORDER":
    "A graceful gap between the border and the body gives this saree its signature contrast and a distinctive, modern look.\n\nHandwoven with care, it offers the comfort of pure Gadwal with an elegance that is easy to recognise.",
  "MAA-INTI-BANGARAM":
    "Maa Inti Bangaram, \"the gold of our home\", celebrates family tradition with a warm gold-toned zari border.\n\nA heirloom-worthy handloom saree for weddings, pujas and the moments you want to remember.",
};

const norm = (v: string) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const BY_NAME: Record<string, string> = {
  [norm("Checks")]: DESIGN_DESCRIPTIONS.CHECKS,
  [norm("Equal Borders")]: DESIGN_DESCRIPTIONS["EQUAL-BORDERS"],
  [norm("Kanchi Big Borders")]: DESIGN_DESCRIPTIONS["KANCHI-BIG-BORDERS"],
  [norm("Gap Border")]: DESIGN_DESCRIPTIONS["GAP-BORDER"],
  [norm("Maa Inti Bangaram")]: DESIGN_DESCRIPTIONS["MAA-INTI-BANGARAM"],
};

/** Description for a design pattern, by slug or by name. Empty string for unknown patterns. */
export function getDesignDescription(slugOrName: string | null | undefined): string {
  if (!slugOrName) return "";
  return DESIGN_DESCRIPTIONS[String(slugOrName).toUpperCase()] || BY_NAME[norm(slugOrName)] || "";
}

/** Auto-generated placeholder descriptions that should be replaced by the pattern's description. */
export function isAutoDescription(desc: string | null | undefined, productName?: string): boolean {
  const d = String(desc || "").trim();
  if (!d) return true;
  return (
    /^Bulk loom intake for /i.test(d) ||
    /^Handcrafted .* saree drape\.?$/i.test(d) ||
    (!!productName && d === `${productName} - Handcrafted Gadwal saree.`)
  );
}
