export type ProductMaterial =
  | "Silk Cotton (SiCo)"
  | "Pure Handloom Silk"
  | "Gadwal Zari Silk"
  | "Organic Cotton";

export type ProductCategory = "SiCo Gadwal Sarees";

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
}
