// src/types/inventory.ts

/* =========================================================
   DEVICE
========================================================= */

export type Platform = "windows" | "android" | "ios";

export interface Device {
  id: string;
  uuid: string;
  name: string;
  platform: Platform;
  lastActive: string;
  isCurrentDevice: boolean;
  ipAddress?: string;
  location?: string;
}

/* =========================================================
   STOCK MOVEMENTS
========================================================= */

export type MovementType =
  | "RESTOCK"
  | "SALE"
  | "RETURN"
  | "DAMAGE"
  | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  date: string;
  sku: string;
  productName: string;
  color: string;
  colorSlug: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNumber: string;
  performedBy: string;
  note?: string;
}

/* =========================================================
   BILLING
========================================================= */

export type BillingType = "gst" | "non-gst";

export type PaymentMethod =
  | "cashfree"
  | "upi"
  | "card"
  | "cash"
  | "split"
  | "phonepe"
  | "razorpay";

export interface CustomerDetails {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
  gstin?: string;
}

export interface CartItem {
  cartId: string;
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  hsn: string;
  color: string;
  colorSlug: string;
  unitPrice: number;
  qty: number;
  maxStock: number;
}

/**
 * Completed sale / transaction record.
 *
 * The original fields are retained for compatibility
 * with existing billing/history code.
 *
 * The optional fields support GST / Non-GST billing,
 * customer records and transaction analysis.
 */
export interface CompletedSale {
  /* Existing transaction fields */
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  total: number;
  grandTotal?: number;
  paymentMethod: PaymentMethod;
  paymentLink?: string;
  transactionId?: string;

  /* Extended billing information */
  billingType?: BillingType;
  customer?: CustomerDetails;
  promoCode?: string;
  taxableAmount?: number;
  gstRate?: number;
  totalTax?: number;
}

/* =========================================================
   CATEGORIES
========================================================= */

export interface Category {
  id: string;
  name: string;
  slug: string;
  hsn: string;

  /**
   * Kept for compatibility with existing category data.
   *
   * SKU generation is based on Design, not Category.
   */
  nextSequence: number;
}

/* =========================================================
   DESIGNS
========================================================= */

export interface DesignOption {
  name: string;
  slug: string;
}

/**
 * Available saree designs.
 *
 * The slug is used as the Design Code in the SKU.
 *
 * Example:
 * Vintage Checks -> VC
 * Gatti Borders  -> GB
 */
export const MOCK_DESIGNS: DesignOption[] = [
  {
    name: "Vintage Checks",
    slug: "VC",
  },
  {
    name: "Gatti Borders",
    slug: "GB",
  },
  {
    name: "Ma Inti Bangaram 3 Inch Borders",
    slug: "MIB3B",
  },
  {
    name: "Big Kanchi Borders",
    slug: "BKB",
  },
  {
    name: "Equal Kanchi Borders",
    slug: "EKB",
  },
  {
    name: "Chakra Border",
    slug: "CB",
  },
  {
    name: "Gap Borders",
    slug: "GAP",
  },
  {
    name: "Gap Border Checks",
    slug: "GCB",
  },
  {
    name: "Box Gadwal Checks",
    slug: "BGC",
  },
  {
    name: "Broad checks",
    slug: "BC",
  },
];

/* =========================================================
   COLOUR CATALOGUE
========================================================= */

export interface ColorDefinition {
  /**
   * Human-readable color name.
   */
  name: string;

  /**
   * Unique short color code used in SKU.
   */
  code: string;
}

/**
 * Canonical VIBGYOR Saree Colors
 */
export const VIBGYOR_COLORS = [
  "Violet",
  "Indigo",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Red",
] as const;

export type VibgyorColor = (typeof VIBGYOR_COLORS)[number];

export const VIBGYOR_COLOR_CODES: ColorDefinition[] = [
  { name: "Violet", code: "VLT" },
  { name: "Indigo", code: "IND" },
  { name: "Blue", code: "BLU" },
  { name: "Green", code: "GRN" },
  { name: "Yellow", code: "YEL" },
  { name: "Orange", code: "ORG" },
  { name: "Red", code: "RED" },
];

/**
 * Active selectable color palette for Admin saree management: ONLY VIBGYOR
 */
export const COLOR_CODES: ColorDefinition[] = VIBGYOR_COLOR_CODES;

/**
 * Legacy Color Catalogue for backwards compatibility with existing sarees.
 */
export const LEGACY_COLOR_CODES: ColorDefinition[] = [
  ...VIBGYOR_COLOR_CODES,
  /* --- Basic & Primary Essentials --- */
  { name: "Crimson Red", code: "RD" },
  { name: "Navy Blue", code: "NB" },
  { name: "Royal Blue", code: "RB" },
  { name: "Sky Blue", code: "SB" },
  { name: "Midnight Blue", code: "BL" },
  { name: "Peacock Blue", code: "PB" },
  { name: "Emerald Green", code: "GR" },
  { name: "Bottle Green", code: "BG" },
  { name: "Olive Green", code: "OL" },
  { name: "Mint Green", code: "MN" },
  { name: "Pista Green", code: "PI" },
  { name: "Sea Green", code: "SG" },
  { name: "Lemon Yellow", code: "LY" },
  { name: "Golden Yellow", code: "GY" },
  { name: "Mustard Yellow", code: "MY" },
  { name: "Mustard Violet", code: "MV" },


  /* --- Pinks, Corals & Peaches --- */
  { name: "Pink", code: "PNK" },
  { name: "Rose Pink", code: "PK" },
  { name: "Hot Pink", code: "HP" },
  { name: "Baby Pink", code: "BP" },
  { name: "Magenta", code: "MA" },
  { name: "Coral", code: "CO" },
  { name: "Peach", code: "PC" },

  /* --- Oranges & Warm Tones --- */
  { name: "Orange", code: "OR" },
  { name: "Rust Orange", code: "RO" },
  { name: "Tangerine", code: "TG" },
  { name: "Amber", code: "AM" },

  /* --- Purples, Violets & Wine --- */
  { name: "Purple", code: "PR" },
  { name: "Violet", code: "VT" },
  { name: "Lavender", code: "LV" },
  { name: "Lilac", code: "LC" },
  { name: "Wine", code: "WN" },
  { name: "Maroon", code: "MR" },
  { name: "Maroon Gold", code: "MG" },
  { name: "Burgundy", code: "BU" },
  { name: "Plum", code: "PL" },

  /* --- Teals & Aquas --- */
  { name: "Teal", code: "TE" },
  { name: "Deep Teal", code: "TL" },
  { name: "Aqua", code: "AQ" },
  { name: "Turquoise", code: "TQ" },
  { name: "Cyan", code: "CY" },

  /* --- Neutrals, Earth & Monochromes --- */
  { name: "Black", code: "BK" },
  { name: "White", code: "WH" },
  { name: "Off White", code: "OW" },
  { name: "Grey", code: "GRY" },
  { name: "Charcoal", code: "CH" },
  { name: "Silver Grey", code: "SGY" },
  { name: "Cream", code: "CR" },
  { name: "Beige", code: "BE" },
  { name: "Ivory", code: "IV" },
  { name: "Brown", code: "BR" },
  { name: "Chocolate Brown", code: "CB" },
  { name: "Tan", code: "TN" },
  { name: "Khaki", code: "KH" },
  { name: "Coffee", code: "CF" },

  /* --- Metallic & Festive Zari Accents --- */
  { name: "Gold", code: "GD" },
  { name: "Silver", code: "SV" },
  { name: "Rose Gold", code: "RG" },
  { name: "Copper", code: "CP" },
  { name: "Bronze", code: "BZ" },
  { name: "Champagne Silver", code: "CS" },
  { name: "Antique Gold", code: "AG" },
];

/* =========================================================
   COLOR VARIANTS
========================================================= */

export interface ColorVariant {
  /**
   * Human-readable color name.
   */
  color: string;

  /**
   * Short color code used in SKU.
   */
  colorSlug: string;

  /**
   * Available quantity for this color.
   */
  stock: number;

  /**
   * Complete SKU for this specific color variant.
   */
  sku: string;

  /**
   * Optional shade photograph URL
   */
  imageUrl?: string;
}

/* =========================================================
   PRODUCT
========================================================= */

export interface Product {
  /**
   * Primary product SKU / identifier.
   */
  id: string;

  /**
   * Design Title / Saree Pattern.
   */
  name: string;

  /**
   * Weave Category ID.
   */
  categoryId: string;

  /**
   * Purchase price.
   */
  purchasePrice: number;

  /**
   * Selling price.
   */
  salePrice: number;

  /**
   * Search/filter tags.
   */
  tags: string[];

  /**
   * Available color variants.
   */
  variants: ColorVariant[];

  /**
   * Optional product image.
   */
  imageUrl?: string;

  /**
   * Optional multiple product images.
   */
  images?: string[];

  /**
   * Special offer flag (Admin marked for Trending & Exclusive Offers).
   */
  isSpecialOffer?: boolean;
}


/* =========================================================
   DASHBOARD
========================================================= */

export type OrderDirection = "OUTWARD_CUSTOMER" | "INWARD_WEAVER";

export type OrderStage =
  // Inward Weaver Stages:
  | "LOOM_COMMISSIONED"
  | "WEAVING_IN_PROGRESS"
  | "QC_FINISHING"
  | "SHOWROOM_RECEIVED"
  // Outward Customer Stages:
  | "ORDER_PACKED"
  | "COURIER_PICKED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface TrackedOrder {
  id: string;
  trackingNumber: string;
  direction: OrderDirection;
  title: string;
  partyName: string;
  partyContact: string;
  location: string;
  skuList: string[];
  totalPieces: number;
  totalValue: number;
  courierOrLoomPartner: string;
  currentStage: OrderStage;
  estimatedCompletion: string;
  lastUpdate: string;
  notes?: string;
  historyTimeline: {
    stageTitle: string;
    timestamp: string;
    locationOrDetail: string;
    completed: boolean;
  }[];
}

export const MOCK_TRACKED_ORDERS: TrackedOrder[] = [];

export type DashboardTab =
  | "overview"
  | "catalog"
  | "history"
  | "sales-ledger"
  | "billing"
  | "analytics"
  | "crm"
  | "tracking"
  | "bulk-stock"
  | "low-stock"
  | "sale"
  | "settings"
  | "devices"
  | "categories"
  | "reviews";

/* =========================================================
   MOCK Customers (Empty by default - sourced from backend)
========================================================= */

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  state?: string;
  totalSpent: number;
  ordersCount: number;
  birthday?: string;
  anniversary?: string;
  preferredWeave?: string;
  notes?: string;
  gstin?: string;
  authProvider?: "google" | "email" | "direct";
  joinedAt?: string;
  lastActiveAt?: string;
  status?: "active" | "inactive";
  inactivityDays?: number;
}

export interface SaleTierOffer {
  id: string;
  qty: number;
  price: number;
  label: string;
  savingsText?: string;
}

export interface SaleProductItem {
  id: string;
  name: string;
  imageUrl: string;
  originalPrice?: number;
  salePrice?: number;
  category?: string;
  customOfferText?: string;
  isActive?: boolean;
}

export interface SaleConfig {
  isEnabled: boolean;
  saleTitle: string;
  subtitle: string;
  discountBadge?: string;
  couponCode?: string;
  tierOffers: SaleTierOffer[];
  saleItems?: SaleProductItem[];
  saleProductIds?: string[];
  bannerBgColor?: string;
}

export const MOCK_CUSTOMERS: CustomerProfile[] = [];

/* =========================================================
   MOCK CATEGORIES (Empty by default - sourced from backend)
========================================================= */

export const MOCK_CATEGORIES: Category[] = [];

/* =========================================================
   MOCK INVENTORY (Empty by default - sourced from backend)
========================================================= */

export const MOCK_INVENTORY: Product[] = [];

/* =========================================================
   MOCK STOCK HISTORY (Empty by default - sourced from backend)
========================================================= */

export const MOCK_STOCK_HISTORY: StockMovement[] = [];

// Runtime fallback exports for browser ESM compatibility
export const CompletedSale: any = undefined;
export const Product: any = undefined;
export const StockMovement: any = undefined;
export const Device: any = undefined;
export const DashboardTab: any = undefined;
export const ColorVariant: any = undefined;
export const Category: any = undefined;
export const CartItem: any = undefined;
export const CustomerDetails: any = undefined;
export const CustomerProfile: any = undefined;
export const MovementType: any = undefined;
export const BillingType: any = undefined;
export const PaymentMethod: any = undefined;
export const DesignOption: any = undefined;
export const ColorDefinition: any = undefined;
export const Platform: any = undefined;