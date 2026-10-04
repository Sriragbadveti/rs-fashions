export type ProductMaterial =
  | "SiCo"
  | "Pure Gadwal Handloom"
  | "Pure Handloom Silk"
  | "Gadwal Zari Silk"
  | "Organic Cotton";

export type ProductCategory =
  | "All"
  | "Checks"
  | "Equal Borders"
  | "Kanchi Big Borders"
  | "Vintage Checks"
  | "Gatti Border"
  | "Gap Border"
  | "Maa Inti Bangaram"
  | "SiCo Gadwal Sarees"
  | string;

export interface Product {
  id: number;
  name: string;
  slug: string;

  category: ProductCategory;
  material: ProductMaterial;

  price: number;
  originalPrice?: number;

  rating: number;
  reviewCount: number;

  image: string;
  images: string[];

  description: string;

  colors: string[];

  isNew?: boolean;
  isBestSeller?: boolean;

  badge?: string;
  borderColor?: string;
}
