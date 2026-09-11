export type ProductMaterial =
  | "Silk"
  | "Cotton"
  | "Chiffon"
  | "Georgette"
  | "Organza"
  | "Linen"
  | "Banarasi";

export type ProductCategory =
  | "Sarees"
  | "Designer"
  | "Festive"
  | "Party Wear"
  | "New Arrivals";

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
