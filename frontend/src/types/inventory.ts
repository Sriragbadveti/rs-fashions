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
 * Master Color Catalogue.
 *
 * These codes are used directly inside the SKU:
 * RSF-{DESIGN_CODE}-{COLOR_CODE}-{SERIAL}
 */
export const COLOR_CODES: ColorDefinition[] = [
  /* --- Basic & Primary Essentials --- */
  { name: "Red", code: "RED" },
  { name: "Crimson Red", code: "RD" },
  { name: "Blue", code: "BLU" },
  { name: "Navy Blue", code: "NB" },
  { name: "Royal Blue", code: "RB" },
  { name: "Sky Blue", code: "SB" },
  { name: "Midnight Blue", code: "BL" },
  { name: "Peacock Blue", code: "PB" },
  { name: "Green", code: "GRN" },
  { name: "Emerald Green", code: "GR" },
  { name: "Bottle Green", code: "BG" },
  { name: "Olive Green", code: "OL" },
  { name: "Mint Green", code: "MN" },
  { name: "Pista Green", code: "PI" },
  { name: "Sea Green", code: "SG" },
  { name: "Yellow", code: "YEL" },
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

export const MOCK_TRACKED_ORDERS: TrackedOrder[] = [
  {
    id: "ord-001",
    trackingNumber: "BD-HYD-992104",
    direction: "OUTWARD_CUSTOMER",
    title: "Bridal Gadwal Silk Trousseau Parcel",
    partyName: "Smt. Shailaja Reddy",
    partyContact: "9849012345",
    location: "Banjara Hills Rd No. 12, Hyderabad",
    skuList: ["RSF-MIB3B-MG-001", "RSF-VC-RD-001"],
    totalPieces: 2,
    totalValue: 43000,
    courierOrLoomPartner: "Blue Dart Air Express",
    currentStage: "OUT_FOR_DELIVERY",
    estimatedCompletion: "Today by 4:00 PM",
    lastUpdate: "Out with courier agent (Ramesh Kumar)",
    notes: "Signature & OTP verification required upon handover.",
    historyTimeline: [
      {
        stageTitle: "Order Packed & Fall-Pico Finished",
        timestamp: "10 Sep 2026, 09:30 AM",
        locationOrDetail: "Jubilee Hills Flagship Studio",
        completed: true,
      },
      {
        stageTitle: "Handed over to Blue Dart Hub",
        timestamp: "10 Sep 2026, 11:15 AM",
        locationOrDetail: "Banjara Hills Logistics Center",
        completed: true,
      },
      {
        stageTitle: "Out for Delivery",
        timestamp: "10 Sep 2026, 01:45 PM",
        locationOrDetail: "Van #TS-09-UB-4022",
        completed: true,
      },
      {
        stageTitle: "Delivered to Patron",
        timestamp: "Expected 4:00 PM",
        locationOrDetail: "Patron Residence",
        completed: false,
      },
    ],
  },
  {
    id: "ord-002",
    trackingNumber: "LOOM-GDW-BATCH-18",
    direction: "INWARD_WEAVER",
    title: "Pure Gold Zari Ma Inti Bangaram Loom Batch",
    partyName: "Master Weaver K. Narayana",
    partyContact: "9440182931",
    location: "Artisan Cooperative, Gadwal, Telangana",
    skuList: ["RSF-MIB3B-MG-001", "RSF-MIB3B-MV-001"],
    totalPieces: 8,
    totalValue: 128000,
    courierOrLoomPartner: "Cooperative Loom Cluster #3",
    currentStage: "WEAVING_IN_PROGRESS",
    estimatedCompletion: "16 Sep 2026",
    lastUpdate: "Pallu Zari interlocking in progress on 4 Pit Looms",
    notes: "Tested pure silver zari electroplated in 24kt gold.",
    historyTimeline: [
      {
        stageTitle: "Raw Silk Warp & Zari Allocation",
        timestamp: "02 Sep 2026",
        locationOrDetail: "Gadwal Raw Material Depot",
        completed: true,
      },
      {
        stageTitle: "Handloom Setup & Border Interlocking",
        timestamp: "05 Sep 2026",
        locationOrDetail: "Loom Workshop #3",
        completed: true,
      },
      {
        stageTitle: "Hand-Weaving in Progress (75% Complete)",
        timestamp: "09 Sep 2026",
        locationOrDetail: "Master Weaver K. Narayana",
        completed: true,
      },
      {
        stageTitle: "Quality Inspection & Showroom Inward",
        timestamp: "Expected 16 Sep 2026",
        locationOrDetail: "RS Fashions Hyderabad",
        completed: false,
      },
    ],
  },
  {
    id: "ord-003",
    trackingNumber: "DTDC-EXP-401129",
    direction: "OUTWARD_CUSTOMER",
    title: "Vintage Checks SiCo Drape (Domestic Courier)",
    partyName: "Dr. Ananya Rao",
    partyContact: "9988776655",
    location: "Koramangala, Bengaluru, Karnataka",
    skuList: ["RSF-VC-TL-001"],
    totalPieces: 1,
    totalValue: 18500,
    courierOrLoomPartner: "DTDC Prime Express",
    currentStage: "IN_TRANSIT",
    estimatedCompletion: "12 Sep 2026",
    lastUpdate: "Departed Hyderabad Transit Hub",
    notes: "Fragile luxury silk double-box packaging.",
    historyTimeline: [
      {
        stageTitle: "Boutique Packaging Complete",
        timestamp: "09 Sep 2026, 05:00 PM",
        locationOrDetail: "Hyderabad Store",
        completed: true,
      },
      {
        stageTitle: "Scanned at Hyderabad Airport Hub",
        timestamp: "10 Sep 2026, 06:15 AM",
        locationOrDetail: "Shamshabad Cargo Facility",
        completed: true,
      },
      {
        stageTitle: "In Flight Transit to Bengaluru",
        timestamp: "10 Sep 2026, 02:30 PM",
        locationOrDetail: "Flight 6E-401",
        completed: true,
      },
      {
        stageTitle: "Delivered",
        timestamp: "Expected 12 Sep 2026",
        locationOrDetail: "Bengaluru Destination",
        completed: false,
      },
    ],
  },
];

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
   MOCK Customers
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

export const MOCK_CUSTOMERS: CustomerProfile[] = [
  {
    id: "cust-001",
    name: "Shailaja Reddy",
    phone: "9849012345",
    email: "shailaja.reddy@gmail.com",
    city: "Banjara Hills, Hyderabad",
    address: "Plot 12, Road No. 2, Banjara Hills",
    totalSpent: 184500,
    ordersCount: 7,
    birthday: "1982-09-14",
    anniversary: "2006-11-28",
    preferredWeave: "Ma Inti Bangaram 3 Inch Borders",
    notes: "Prefers pure gold zari with Crimson Red or Maroon borders.",
  },
  {
    id: "cust-002",
    name: "Dr. Ananya Rao",
    phone: "9988776655",
    email: "ananya.rao@carehospitals.com",
    city: "Jubilee Hills, Hyderabad",
    address: "Door No. 8-2, Jubilee Hills",
    totalSpent: 92400,
    ordersCount: 4,
    birthday: "1988-12-05",
    anniversary: "2015-09-12",
    preferredWeave: "Vintage Checks",
    notes: "Buys for family gifting and bridal weddings.",
  },
  {
    id: "cust-003",
    name: "Vani Prasanna",
    phone: "9123456780",
    city: "Secunderabad",
    address: "M G Road, Secunderabad",
    totalSpent: 38000,
    ordersCount: 2,
    birthday: "1994-09-16",
    preferredWeave: "Gatti Borders",
    notes: "Loves lightweight SiCo Gadwal weaves.",
  },
];

/* =========================================================
   MOCK CATEGORIES
========================================================= */

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "c1",
    name: "SiCo Gadwal Sarees",
    slug: "SGS",
    hsn: "5208",
    nextSequence: 1,
  },
];

/* =========================================================
   MOCK INVENTORY
========================================================= */

export const MOCK_INVENTORY: Product[] = [
  {
    id: "RSF-VC-RD-001",
    name: "Vintage Checks",
    categoryId: "c1",
    purchasePrice: 12500,
    salePrice: 18500,
    tags: ["handloom", "wedding", "gadwal"],
    variants: [
      {
        color: "Crimson Red",
        colorSlug: "RD",
        stock: 5,
        sku: "RSF-VC-RD-001",
      },
      {
        color: "Deep Teal",
        colorSlug: "TL",
        stock: 3,
        sku: "RSF-VC-TL-001",
      },
    ],
  },
  {
    id: "RSF-GB-GR-001",
    name: "Gatti Borders",
    categoryId: "c1",
    purchasePrice: 22000,
    salePrice: 31000,
    tags: ["premium", "gadwal", "border"],
    variants: [
      {
        color: "Emerald Green",
        colorSlug: "GR",
        stock: 1,
        sku: "RSF-GB-GR-001",
      },
      {
        color: "Midnight Blue",
        colorSlug: "BL",
        stock: 2,
        sku: "RSF-GB-BL-001",
      },
    ],
  },
  {
    id: "RSF-MIB3B-MG-001",
    name: "Ma Inti Bangaram 3 Inch Borders",
    categoryId: "c1",
    purchasePrice: 16000,
    salePrice: 24500,
    tags: ["pure-silk", "bridal", "gadwal"],
    variants: [
      {
        color: "Maroon Gold",
        colorSlug: "MG",
        stock: 8,
        sku: "RSF-MIB3B-MG-001",
      },
      {
        color: "Mustard Violet",
        colorSlug: "MV",
        stock: 2,
        sku: "RSF-MIB3B-MV-001",
      },
    ],
  },
  {
    id: "RSF-BKB-RG-001",
    name: "Big Kanchi Borders",
    categoryId: "c1",
    purchasePrice: 6500,
    salePrice: 9800,
    tags: ["gadwal", "kanchi-border", "partywear"],
    variants: [
      {
        color: "Rose Gold",
        colorSlug: "RG",
        stock: 6,
        sku: "RSF-BKB-RG-001",
      },
      {
        color: "Champagne Silver",
        colorSlug: "CS",
        stock: 4,
        sku: "RSF-BKB-CS-001",
      },
    ],
  },
  {
    id: "RSF-EKB-RG-001",
    name: "Equal Kanchi Borders",
    categoryId: "c1",
    purchasePrice: 6500,
    salePrice: 9800,
    tags: ["gadwal", "kanchi-border", "partywear"],
    variants: [
      {
        color: "Rose Gold",
        colorSlug: "RG",
        stock: 6,
        sku: "RSF-EKB-RG-001",
      },
      {
        color: "Champagne Silver",
        colorSlug: "CS",
        stock: 4,
        sku: "RSF-EKB-CS-001",
      },
    ],
  },
  {
    id: "RSF-CB-RG-001",
    name: "Chakra Border",
    categoryId: "c1",
    purchasePrice: 6500,
    salePrice: 9800,
    tags: ["gadwal", "chakra", "partywear"],
    variants: [
      {
        color: "Rose Gold",
        colorSlug: "RG",
        stock: 6,
        sku: "RSF-CB-RG-001",
      },
      {
        color: "Champagne Silver",
        colorSlug: "CS",
        stock: 4,
        sku: "RSF-CB-CS-001",
      },
    ],
  },
  {
    id: "RSF-GAP-RG-001",
    name: "Gap Borders",
    categoryId: "c1",
    purchasePrice: 6500,
    salePrice: 9800,
    tags: ["gadwal", "border", "partywear"],
    variants: [
      {
        color: "Rose Gold",
        colorSlug: "RG",
        stock: 6,
        sku: "RSF-GAP-RG-001",
      },
      {
        color: "Champagne Silver",
        colorSlug: "CS",
        stock: 4,
        sku: "RSF-GAP-CS-001",
      },
    ],
  },
  {
    id: "RSF-GCB-RG-001",
    name: "Gap Border Checks",
    categoryId: "c1",
    purchasePrice: 6500,
    salePrice: 9800,
    tags: ["gadwal", "checks", "border"],
    variants: [
      {
        color: "Rose Gold",
        colorSlug: "RG",
        stock: 6,
        sku: "RSF-GCB-RG-001",
      },
      {
        color: "Champagne Silver",
        colorSlug: "CS",
        stock: 4,
        sku: "RSF-GCB-CS-001",
      },
    ],
  },
  {
    id: "RSF-BGC-RG-001",
    name: "Box Gadwal Checks",
    categoryId: "c1",
    purchasePrice: 6500,
    salePrice: 9800,
    tags: ["gadwal", "checks", "box-pattern"],
    variants: [
      {
        color: "Rose Gold",
        colorSlug: "RG",
        stock: 6,
        sku: "RSF-BGC-RG-001",
      },
      {
        color: "Champagne Silver",
        colorSlug: "CS",
        stock: 4,
        sku: "RSF-BGC-CS-001",
      },
    ],
  },
];

/* =========================================================
   MOCK STOCK HISTORY
========================================================= */

export const MOCK_STOCK_HISTORY: StockMovement[] = [
  {
    id: "mov-001",
    date: "10 Sep 2026, 04:15 PM",
    sku: "RSF-VC-RD-001",
    productName: "Vintage Checks",
    color: "Crimson Red",
    colorSlug: "RD",
    type: "SALE",
    quantity: -1,
    previousStock: 6,
    newStock: 5,
    referenceNumber: "INV-9021",
    performedBy: "RS Fashions",
    note: "POS Counter #1 Sale",
  },
  {
    id: "mov-002",
    date: "10 Sep 2026, 01:30 PM",
    sku: "RSF-GB-GR-001",
    productName: "Gatti Borders",
    color: "Emerald Green",
    colorSlug: "GR",
    type: "SALE",
    quantity: -2,
    previousStock: 3,
    newStock: 1,
    referenceNumber: "INV-9018",
    performedBy: "Store Manager",
    note: "Bridal trousseau purchase",
  },
  {
    id: "mov-003",
    date: "09 Sep 2026, 11:00 AM",
    sku: "RSF-MIB3B-MG-001",
    productName: "Ma Inti Bangaram 3 Inch Borders",
    color: "Maroon Gold",
    colorSlug: "MG",
    type: "RESTOCK",
    quantity: 8,
    previousStock: 0,
    newStock: 8,
    referenceNumber: "PO-WEAVER-GADWAL-42",
    performedBy: "RS Fashions",
    note: "Gadwal master weaver direct shipment batch #4",
  },
  {
    id: "mov-004",
    date: "08 Sep 2026, 05:45 PM",
    sku: "RSF-VC-TL-001",
    productName: "Vintage Checks",
    color: "Deep Teal",
    colorSlug: "TL",
    type: "RESTOCK",
    quantity: 5,
    previousStock: 0,
    newStock: 5,
    referenceNumber: "PO-WEAVER-GADWAL-41",
    performedBy: "RS Fashions",
    note: "Pre-festive fresh consignment",
  },
  {
    id: "mov-005",
    date: "07 Sep 2026, 03:20 PM",
    sku: "RSF-BKB-RG-001",
    productName: "Big Kanchi Borders",
    color: "Rose Gold",
    colorSlug: "RG",
    type: "DAMAGE",
    quantity: -1,
    previousStock: 7,
    newStock: 6,
    referenceNumber: "DEF-2026-09",
    performedBy: "RS Fashions",
    note: "Zari pulled on pallu during transit - marked for restoration",
  },
];

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