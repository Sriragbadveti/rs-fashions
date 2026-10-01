export interface Product {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  rating: number;
  reviewCount: number;
  description: string;
  longDescription: string;
  images: string[];
  colors: string[];
  sizes: string[];
  featured?: boolean;
  borderColor?: string;
  sku?: string;
  isSpecialEdition?: boolean;
  isSpecialOffer?: boolean;
  isOfferEligible?: boolean;
  tags?: string[];
  variants?: any[];
}

export const products: Product[] = [];
