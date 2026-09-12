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