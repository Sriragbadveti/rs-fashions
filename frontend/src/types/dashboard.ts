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
  { name: "Gap Borders", slug: "GAP" },
  { name: "Gap Border Checks", slug: "GBC" },
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
  imageUrl?: string;
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
  | "bulk-stock"
  | "low-stock"
  | "sale"
  | "trending"
  | "settings"
  | "categories"
  | "reviews";

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  totalSpent: number;
  ordersCount: number;
  birthday?: string;
  anniversary?: string;
  preferredWeave?: string;
  notes?: string;
  gstin?: string;
  status?: "active" | "inactive";
  lastActiveAt?: string;
  inactivityDays?: number;
}

export interface UserSession {
  name: string;
  email: string;
  role: string;
}

export const MOCK_CUSTOMERS: CustomerProfile[] = [];

export const MOCK_CATEGORIES: Category[] = [];

export const MOCK_INVENTORY: DashboardProduct[] = [];

export const MOCK_STOCK_HISTORY: StockMovement[] = [];

export const MOCK_TRACKED_ORDERS: TrackedOrder[] = [];


