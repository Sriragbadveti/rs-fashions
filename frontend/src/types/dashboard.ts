// frontend/src/types/dashboard.ts

export type Platform = "windows" | "android" | "ios" | "web";

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

export type BillingType = "gst" | "non-gst";

export type PaymentMethod =
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
  image?: string;
}

export interface CompletedSale {
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
  paymentMethod: PaymentMethod;
  billingType?: BillingType;
  customer?: CustomerDetails;
  promoCode?: string;
  taxableAmount?: number;
  gstRate?: number;
  totalTax?: number;
  paymentLink?: string;
  transactionId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  hsn: string;
  nextSequence: number;
}

export interface DesignOption {
  name: string;
  slug: string;
}

export const WEAVE_DESIGN_PRESETS: DesignOption[] = [
  { name: "Vintage Checks", slug: "VC" },
  { name: "Gatti Borders", slug: "GB" },
  { name: "Ma Inti Bangaram 3 Inch Borders", slug: "MIB3B" },
  { name: "Big Kanchi Borders", slug: "BKB" },
  { name: "Equal Kanchi Borders", slug: "EKB" },
  { name: "Chakra Border", slug: "CB" },
  { name: "Gab Borders", slug: "GAB" },
  { name: "Gab Checks Borders", slug: "GCB" },
  { name: "Box Gadwal Checks", slug: "BGC" },
];

export interface ColorDefinition {
  name: string;
  code: string;
}

export const COLOR_CODES: ColorDefinition[] = [
  { name: "Crimson Red", code: "RD" },
  { name: "Deep Teal", code: "TL" },
  { name: "Emerald Green", code: "GR" },
  { name: "Midnight Blue", code: "BL" },
  { name: "Maroon", code: "MR" },
  { name: "Maroon Gold", code: "MG" },
  { name: "Mustard Yellow", code: "MY" },
  { name: "Mustard Violet", code: "MV" },
  { name: "Rose Pink", code: "PK" },
  { name: "Hot Pink", code: "HP" },
  { name: "Baby Pink", code: "BP" },
  { name: "Peach", code: "PC" },
  { name: "Orange", code: "OR" },
  { name: "Rust Orange", code: "RO" },
  { name: "Wine", code: "WN" },
  { name: "Purple", code: "PR" },
  { name: "Violet", code: "VT" },
  { name: "Lavender", code: "LV" },
  { name: "Sky Blue", code: "SB" },
  { name: "Royal Blue", code: "RB" },
  { name: "Navy Blue", code: "NB" },
  { name: "Peacock Blue", code: "PB" },
  { name: "Pista Green", code: "PI" },
  { name: "Mint Green", code: "MN" },
  { name: "Bottle Green", code: "BG" },
  { name: "Olive Green", code: "OL" },
  { name: "Lemon Yellow", code: "LY" },
  { name: "Golden Yellow", code: "GY" },
  { name: "Gold", code: "GD" },
  { name: "Silver", code: "SV" },
  { name: "Champagne Silver", code: "CS" },
  { name: "Rose Gold", code: "RG" },
  { name: "Copper", code: "CP" },
  { name: "Beige", code: "BE" },
  { name: "Cream", code: "CR" },
  { name: "Off White", code: "OW" },
  { name: "White", code: "WH" },
  { name: "Black", code: "BK" },
];

export interface ColorVariant {
  color: string;
  colorSlug: string;
  stock: number;
  sku: string;
}

export interface DashboardProduct {
  id: string;
  name: string;
  categoryId: string;
  purchasePrice: number;
  salePrice: number;
  tags: string[];
  variants: ColorVariant[];
  imageUrl?: string;
  material?: string;
  description?: string;
}

export type OrderDirection = "OUTWARD_CUSTOMER" | "INWARD_WEAVER";

export type OrderStage =
  | "LOOM_COMMISSIONED"
  | "WEAVING_IN_PROGRESS"
  | "QC_FINISHING"
  | "SHOWROOM_RECEIVED"
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

export type DashboardTab =
  | "overview"
  | "catalog"
  | "history"
  | "sales-ledger"
  | "billing"
  | "analytics"
  | "crm"
  | "tracking"
  | "settings"
  | "categories";

export type ClientTier = "Royal Patron" | "Heritage Club" | "Boutique Member";

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  tier: ClientTier;
  totalSpent: number;
  ordersCount: number;
  birthday?: string;
  anniversary?: string;
  preferredWeave?: string;
  notes?: string;
  gstin?: string;
}

export interface UserSession {
  name: string;
  email: string;
  role: string;
}

export const MOCK_CUSTOMERS: CustomerProfile[] = [
  {
    id: "cust-001",
    name: "Shailaja Reddy",
    phone: "9849012345",
    email: "shailaja.reddy@gmail.com",
    city: "Banjara Hills, Hyderabad",
    tier: "Royal Patron",
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
    tier: "Heritage Club",
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
    tier: "Boutique Member",
    totalSpent: 38000,
    ordersCount: 2,
    birthday: "1994-09-16",
    preferredWeave: "Gatti Borders",
    notes: "Loves lightweight SiCo Gadwal weaves.",
  },
];

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "c1",
    name: "SiCo Gadwal Sarees",
    slug: "SGS",
    hsn: "5208",
    nextSequence: 1,
  },
  {
    id: "c2",
    name: "Pure Silk Kanjivaram",
    slug: "PSK",
    hsn: "5007",
    nextSequence: 1,
  },
  {
    id: "c3",
    name: "Banarasi Silk Heritage",
    slug: "BSH",
    hsn: "5007",
    nextSequence: 1,
  },
  {
    id: "c4",
    name: "Handloom Cotton",
    slug: "HLC",
    hsn: "5208",
    nextSequence: 1,
  },
  {
    id: "c5",
    name: "Pochampally Ikat",
    slug: "PIK",
    hsn: "5208",
    nextSequence: 1,
  },
  {
    id: "c6",
    name: "Paithani Silk",
    slug: "PAI",
    hsn: "5007",
    nextSequence: 1,
  },
];

export const MOCK_INVENTORY: DashboardProduct[] = [
  // ── SiCo Gadwal Sarees (c1) ───────────────────────────────────────────────
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
    id: "RSF-GAB-RG-001",
    name: "Gab Borders",
    categoryId: "c1",
    purchasePrice: 6500,
    salePrice: 9800,
    tags: ["gadwal", "border", "partywear"],
    variants: [
      {
        color: "Rose Gold",
        colorSlug: "RG",
        stock: 6,
        sku: "RSF-GAB-RG-001",
      },
      {
        color: "Champagne Silver",
        colorSlug: "CS",
        stock: 4,
        sku: "RSF-GAB-CS-001",
      },
    ],
  },
  {
    id: "RSF-GCB-RG-001",
    name: "Gab Checks Borders",
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

  // ── Pure Silk Kanjivaram (c2) ─────────────────────────────────────────────
  {
    id: "RSF-KBH-PK-001",
    name: "Kanjivaram Bridal Heritage",
    categoryId: "c2",
    purchasePrice: 18500,
    salePrice: 28000,
    tags: ["kanjivaram", "bridal", "pure-silk", "zari"],
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop",
    variants: [
      {
        color: "Rani Pink",
        colorSlug: "PK",
        stock: 4,
        sku: "RSF-KBH-PK-001",
      },
      {
        color: "Gold",
        colorSlug: "GD",
        stock: 2,
        sku: "RSF-KBH-GD-001",
      },
    ],
  },

  // ── Banarasi Silk Heritage (c3) ───────────────────────────────────────────
  {
    id: "RSF-EBN-GR-001",
    name: "Emerald Banarasi Drape",
    categoryId: "c3",
    purchasePrice: 11000,
    salePrice: 16500,
    tags: ["banarasi", "zari", "festive", "heritage"],
    imageUrl:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800&auto=format&fit=crop",
    variants: [
      {
        color: "Emerald Green",
        colorSlug: "GR",
        stock: 5,
        sku: "RSF-EBN-GR-001",
      },
      {
        color: "Gold Zari",
        colorSlug: "GD",
        stock: 3,
        sku: "RSF-EBN-GD-001",
      },
    ],
  },

  // ── Handloom Cotton (c4) ──────────────────────────────────────────────────
  {
    id: "RSF-ICT-CR-001",
    name: "Ivory Handloom Cotton",
    categoryId: "c4",
    purchasePrice: 2200,
    salePrice: 3600,
    tags: ["cotton", "handloom", "daily", "summer"],
    imageUrl:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop",
    variants: [
      {
        color: "Cream",
        colorSlug: "CR",
        stock: 12,
        sku: "RSF-ICT-CR-001",
      },
      {
        color: "Beige",
        colorSlug: "BE",
        stock: 8,
        sku: "RSF-ICT-BE-001",
      },
    ],
  },

  // ── Pochampally Ikat (c5) ─────────────────────────────────────────────────
  {
    id: "RSF-PIK-NB-001",
    name: "Pochampally Double Ikat",
    categoryId: "c5",
    purchasePrice: 5800,
    salePrice: 8900,
    tags: ["pochampally", "ikat", "handwoven", "geometric"],
    variants: [
      {
        color: "Navy Blue",
        colorSlug: "NB",
        stock: 7,
        sku: "RSF-PIK-NB-001",
      },
      {
        color: "Mustard Yellow",
        colorSlug: "MY",
        stock: 5,
        sku: "RSF-PIK-MY-001",
      },
    ],
  },

  // ── Paithani Silk (c6) ────────────────────────────────────────────────────
  {
    id: "RSF-PAI-PR-001",
    name: "Paithani Peacock Motif",
    categoryId: "c6",
    purchasePrice: 14500,
    salePrice: 22000,
    tags: ["paithani", "peacock", "pure-silk", "maharashtra"],
    variants: [
      {
        color: "Purple",
        colorSlug: "PR",
        stock: 3,
        sku: "RSF-PAI-PR-001",
      },
      {
        color: "Gold",
        colorSlug: "GD",
        stock: 2,
        sku: "RSF-PAI-GD-001",
      },
    ],
  },
];

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
    performedBy: "Sindhu Reddy",
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
    performedBy: "Sindhu Reddy",
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
    performedBy: "Sindhu Reddy",
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
    performedBy: "Sindhu Reddy",
    note: "Zari pulled on pallu during transit - marked for restoration",
  },
];

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
        locationOrDetail: "Jubilee Hills Flagship Atelier",
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

