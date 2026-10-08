/**
 * Business identity shown to customers. These must match the merchant details registered with the
 * payment gateway (Cashfree), so change them here only, never inline in a page.
 *
 *   Brand (display name):  RS Fashions
 *   Legal business name:   M/S R S FASHIONS
 *   Proprietor:            SINDHUJA KANNEBOINA
 */
export const BRAND_NAME = "RS Fashions";
export const LEGAL_BUSINESS_NAME = "M/S R S FASHIONS";
export const PROPRIETOR_NAME = "SINDHUJA KANNEBOINA";

export const SUPPORT_EMAIL = "rsfashionsupport@gmail.com";
export const SUPPORT_PHONE = "9502853964";
export const SUPPORT_PHONE_DISPLAY = "+91 95028 53964";
export const SUPPORT_PHONE_TEL = "+919502853964";
/** Country code + number, the format WhatsApp links expect. */
export const SUPPORT_WHATSAPP = "919502853964";

export const POLICY_LAST_UPDATED = "October 2026";

export function whatsappLink(message: string): string {
  return `https://api.whatsapp.com/send?phone=${SUPPORT_WHATSAPP}&text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject?: string): string {
  return subject ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}` : `mailto:${SUPPORT_EMAIL}`;
}

/** Customer-facing policy pages, in footer order. Paths must exist in App.tsx. */
export const POLICY_LINKS = [
  { label: "About Us", path: "/about-us" },
  { label: "Contact Us", path: "/contact-us" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Terms & Conditions", path: "/terms-and-conditions" },
  { label: "Shipping & Delivery Policy", path: "/shipping-policy" },
  { label: "Cancellation & Refund Policy", path: "/cancellation-refund-policy" },
] as const;
