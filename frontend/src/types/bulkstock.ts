// src/types/bulkstock.ts

import { Product, Category } from "./inventory";

export interface BulkOrderPayload {
  designSlug: string;
  categoryId: string;
  purchasePrice: number;
  salePrice: number;
  mode: "single" | "dual";
  variants: {
    color1: string;
    color2?: string;
    qty: number;
  }[];
}

export type { Product, Category };
/** Result of a bulk intake, as confirmed by the backend. */
export interface BulkRestockResult {
  /** Rows the database confirmed as stored, with the SKU the backend assigned. */
  inserted: { clientRef: string; id: string }[];
  /** Rows that were not stored, with the reason. */
  failed: { clientRef?: string; id?: string | null; error: string }[];
  message?: string;
}
